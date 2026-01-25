import { apiClient } from "@/config/api-client";
import { prisma } from "@/lib/prisma";
import { redisConnection } from "@/config/redis";
import { Worker } from "bullmq";
import { legendPlayerQueue } from "@/queue/legend-player-queue";

const SNAPSHOT_CACHE_KEY_PREFIX = "cache:snapshot:";
const CACHE_TTL = 86400; // 24 horas

/**
 * Processa um jogador individual: busca dados, verifica troféus e cria logs
 */
async function processPlayer(playerTag: string) {
  // Timeout wrapper para garantir que o job não trave indefinidamente
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Job timeout após 45 segundos")), 45000);
  });

  const apiPromise = apiClient.get(`/players/${encodeURIComponent(playerTag)}`);

  const { data: player } = await Promise.race([apiPromise, timeoutPromise]) as any;

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

  // Lê o último estado do cache do Redis (evita conexão ao banco)
  let lastState: { lastTrophies: number } | null = null;
  try {
    const cached = await redisConnection.get(`${SNAPSHOT_CACHE_KEY_PREFIX}${normalizedPlayerTag}`);
    if (cached) {
      lastState = JSON.parse(cached);
    }
  } catch (error) {
    // Se falhar o cache, continua sem ele
  }

  // Se não tiver no cache, tenta ler do banco (fallback)
  if (!lastState) {
    try {
      const dbState = await prisma.playerSnapshot.findUnique({
        where: { playerTag: normalizedPlayerTag },
        select: { lastTrophies: true },
      });
      if (dbState) {
        lastState = dbState;
      }
    } catch (error) {
      // Ignora erros de conexão, continua sem o estado anterior
    }
  }

  // Só cria logs se o jogador estiver na Legend League E houver mudança de troféus
  if (isInLegendLeague && lastState && currentTrophies !== lastState.lastTrophies) {
    const trophyDiff = currentTrophies - lastState.lastTrophies;

    // Salva diretamente no banco
    if (trophyDiff !== 0) {
      try {
        await prisma.legendLog.create({
          data: {
            playerTag: normalizedPlayerTag,
            playerName: player.name,
            clanTag: clanTag || null,
            type: trophyDiff > 0 ? ("ATTACK" as const) : ("DEFENSE" as const),
            diff: trophyDiff,
            trophiesResult: currentTrophies,
          },
        }).catch((err) => {
          // Ignora erros de duplicata (unique constraint)
          if (!err.message?.includes("Unique constraint") && !err.code?.includes("P2002")) {
            throw err;
          }
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          // Log apenas se não for erro de duplicata
          const prismaError = error as any;
          if (!error.message?.includes("Unique constraint") && !prismaError.code?.includes("P2002")) {
            throw error;
          }
        }
      }
    }
  }

  // SEMPRE atualiza ou cria o snapshot do jogador (mesmo que não esteja na Legend League)
  try {
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

    // Atualiza o cache do Redis após salvar no banco
    try {
      await redisConnection.set(
        `${SNAPSHOT_CACHE_KEY_PREFIX}${normalizedPlayerTag}`,
        JSON.stringify({ lastTrophies: currentTrophies }),
        "EX",
        CACHE_TTL
      );
    } catch (error) {
      // Ignora erros de cache
    }
  } catch (error) {
    // Se falhar, relança o erro
    throw error;
  }

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
        throw error;
      }
    }

    // Job individual: Processa um jogador específico
    if (job.data.playerTag) {
      try {
        return await processPlayer(job.data.playerTag);
      } catch (err: any) {
        throw err;
      }
    }

    // Se não for nenhum tipo conhecido, lança erro
    throw new Error(`Tipo de job desconhecido: ${JSON.stringify(job.data)}`);
  },
  {
    connection: redisConnection,
    concurrency: 20, // Reduzido para 15 para evitar muitas conexões simultâneas
    limiter: {
      max: 20, // Máximo de 10 jobs processados
      duration: 1000, // por segundo (10 req/s para API)
    },

    maxStalledCount: 3, 

  }
);


let completedCount = 0;
let failedCount = 0;
const recentErrors: Array<{ error: string; count: number }> = [];

LegendPlayerWorker.on("completed", (job) => {
  completedCount++;
  const jobData = job?.data as any;
  
  // Log a cada 50, 100, 150 jobs completados
  if (completedCount === 50 || completedCount === 100 || completedCount === 150 || completedCount % 50 === 0) {
    const successRate = failedCount > 0 
      ? ((completedCount / (completedCount + failedCount)) * 100).toFixed(1)
      : "100.0";
    console.log(`✅ ${completedCount} jobs completados | ❌ ${failedCount} falharam | 📊 ${successRate}% sucesso`);
    
    // Mostra erros recentes se houver
    if (recentErrors.length > 0) {
      console.log(`   Erros recentes:`);
      recentErrors.forEach(({ error, count }) => {
        console.log(`   - ${error} (${count}x)`);
      });
      recentErrors.length = 0; // Limpa após mostrar
    }
  }
});

LegendPlayerWorker.on("failed", (job, err) => {
  failedCount++;
  const errorMessage = err.message || "Erro desconhecido";
  const jobData = job?.data as any;

  // Ignora rate limit nos logs
  if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
    return;
  }

  // Adiciona erro à lista de erros recentes
  const errorSummary = errorMessage.substring(0, 100);
  const existingError = recentErrors.find(e => e.error === errorSummary);
  if (existingError) {
    existingError.count++;
  } else {
    recentErrors.push({ error: errorSummary, count: 1 });
  }

  // Log a cada 50, 100, 150 jobs falhados
  if (failedCount === 50 || failedCount === 100 || failedCount === 150 || failedCount % 50 === 0) {
    const successRate = completedCount > 0 
      ? ((completedCount / (completedCount + failedCount)) * 100).toFixed(1)
      : "0.0";
    console.log(`✅ ${completedCount} jobs completados | ❌ ${failedCount} falharam | 📊 ${successRate}% sucesso`);
    
    // Mostra erros recentes
    if (recentErrors.length > 0) {
      console.log(`   Erros recentes:`);
      recentErrors.forEach(({ error, count }) => {
        console.log(`   - ${error} (${count}x)`);
      });
      recentErrors.length = 0; // Limpa após mostrar
    }
  }
});
