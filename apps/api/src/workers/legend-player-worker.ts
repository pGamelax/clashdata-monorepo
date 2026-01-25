import { apiClient } from "@/config/api-client";
import { prisma } from "@/lib/prisma";
import { redisConnection } from "@/config/redis";
import { Worker } from "bullmq";
import { legendPlayerQueue } from "@/queue/legend-player-queue";

/**
 * Processa um jogador individual: busca dados, verifica troféus e cria logs
 */
async function processPlayer(playerTag: string) {
  const { data: player } = await apiClient.get(
    `/players/${encodeURIComponent(playerTag)}`
  );

  // Validação: garante que player.tag existe
  if (!player?.tag) {
    throw new Error(`Player tag não encontrado na resposta da API para ${playerTag}`);
  }

  const currentTrophies = player.trophies || 0;
  const currentAttacks = player.attackWins || 0;
  const isInLegendLeague = player?.leagueTier?.name === "Legend League";
  
  // Obtém o clanTag da resposta da API (se o jogador estiver em um clan)
  const clanTag = player.clan?.tag || null;

  // Garante que a tag está no formato correto (#TAG)
  const normalizedPlayerTag = player.tag.startsWith("#") ? player.tag : `#${player.tag}`;

  const lastState = await prisma.playerSnapshot.findUnique({
    where: { playerTag: normalizedPlayerTag },
  });

  // Só cria logs se o jogador estiver na Legend League E houver mudança de troféus
  if (isInLegendLeague && lastState && currentTrophies !== lastState.lastTrophies) {
    const trophyDiff = currentTrophies - lastState.lastTrophies;

    // Salva apenas um log com a diferença total de troféus
    // Não divide por eventos - salva a diferença real
    if (trophyDiff !== 0) {
      await prisma.legendLog.create({
        data: {
          playerTag: normalizedPlayerTag,
          playerName: player.name,
          clanTag: clanTag || null,
          type: trophyDiff > 0 ? ("ATTACK" as const) : ("DEFENSE" as const),
          diff: trophyDiff, // Diferença total, não dividida
          trophiesResult: currentTrophies,
        },
      }).catch((err) => {
        // Ignora erros de duplicata (unique constraint)
        if (!err.message?.includes("Unique constraint") && !err.code?.includes("P2002")) {
          throw err;
        }
      });
    }
  }

  // SEMPRE atualiza ou cria o snapshot do jogador (mesmo que não esteja na Legend League)
  // Isso permite detectar quando jogadores entram ou saem da Legend League
  await prisma.playerSnapshot.upsert({
    where: { playerTag: normalizedPlayerTag },
    update: {
      lastTrophies: currentTrophies,
      lastAttackWins: currentAttacks,
      playerName: player.name,
    },
    create: {
      playerTag: normalizedPlayerTag,
      playerName: player.name,
      lastTrophies: currentTrophies,
      lastAttackWins: currentAttacks,
    },
  });

  return {
    success: true,
    playerTag: normalizedPlayerTag,
    inLegendLeague: isInLegendLeague,
    hadChanges: lastState ? currentTrophies !== lastState.lastTrophies : false,
  };
}

export const LegendPlayerWorker = new Worker(
  "legend-player",
  async (job) => {
    const jobType = job.data.type;

    // Job Mestre: Distribui jobs individuais para cada jogador (Fan-out)
    if (jobType === "fan-out-master") {
      try {
        // Busca todos os jogadores do playerSnapshot
        const players = await prisma.playerSnapshot.findMany({
          select: {
            playerTag: true,
          },
        });

        if (players.length === 0) {
          return { success: true, jobsCreated: 0, message: "Nenhum jogador no snapshot" };
        }

        // Cria jobs individuais para cada jogador (Fan-out)
        const jobs = players.map((player) => ({
          name: "monitor-player",
          data: {
            playerTag: player.playerTag,
          },
          opts: {
            removeOnComplete: true,
            removeOnFail: false, // Mantém jobs falhos para análise
          },
        }));

        // Adiciona todos os jobs de uma vez (BullMQ otimiza isso)
        await legendPlayerQueue.addBulk(jobs);

        return {
          success: true,
          jobsCreated: jobs.length,
          totalPlayers: players.length,
        };
      } catch (error: any) {
        console.error("Erro no job mestre (fan-out):", error.message);
        throw error;
      }
    }

    // Job individual: Processa um jogador específico
    if (job.data.playerTag) {
      try {
        return await processPlayer(job.data.playerTag);
      } catch (err: any) {
        // Erros de rede - deixa o BullMQ fazer retry com backoff
        if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
          throw err;
        }

        // Erro 429 (rate limit) - deixa o BullMQ fazer retry com backoff exponencial
        if (err.response?.status === 429 || err.message?.includes("429")) {
          throw err; // BullMQ vai fazer retry com backoff configurado
        }

        // Erros do Prisma - log completo para debug
        if (err.message?.includes("Invalid `prisma") || err.message?.includes("prisma.")) {
          console.error(`❌ Erro Prisma na tag ${job.data.playerTag}:`, err.message);
          throw err;
        }

        // Outros erros - log apenas se não for comum
        if (!err.message?.includes("rate limit")) {
          console.error(`Erro na tag ${job.data.playerTag}:`, err.message?.substring(0, 200));
        }
        throw err;
      }
    }

    // Se não for nenhum tipo conhecido, lança erro
    throw new Error(`Tipo de job desconhecido: ${JSON.stringify(job.data)}`);
  },
  {
    connection: redisConnection,
    concurrency: 30, // Processa 30 jogadores em paralelo
  }
);

// Logs apenas para erros importantes (reduzir verbosidade)
let completedCount = 0;
let failedCount = 0;

LegendPlayerWorker.on("completed", (job) => {
  completedCount++;
  const jobData = job.data as any;
});

LegendPlayerWorker.on("failed", (job, err) => {
  failedCount++;
  const errorMessage = err.message || "Erro desconhecido";
  const jobData = job?.data as any;

  // Log apenas erros críticos (não 429, pois já são tratados)
  if (!errorMessage.includes("429") && !errorMessage.includes("rate limit")) {
    if (jobData?.type === "fan-out-master") {
      console.error(`❌ Job mestre (fan-out) falhou:`, errorMessage.substring(0, 200));
    } else {
      // Log apenas alguns erros para não poluir o log
      if (failedCount % 10 === 0 || !errorMessage.includes("404")) {
        console.error(`❌ Job falhou para ${jobData?.playerTag}:`, errorMessage.substring(0, 100));
      }
    }
  }

  // Log resumo a cada 10 falhas
  if (failedCount % 10 === 0) {
    console.warn(`⚠️ Total de ${failedCount} jobs falharam`);
  }
});

LegendPlayerWorker.on("error", (err) => {
  console.error("❌ Erro crítico no Legend Player Worker:", err.message);
});
