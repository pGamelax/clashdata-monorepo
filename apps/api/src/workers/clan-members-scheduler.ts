import { apiClient } from "@/config/api-client";
import { prisma } from "@/lib/prisma";
import { addPlayerToSnapshot } from "@/utils/queue-player";

/**
 * Busca todos os jogadores dos clans cadastrados e adiciona ao playerSnapshot
 * Executa a cada 5 minutos
 */
export async function scheduleClanMembersMonitoring() {
  try {
    // Busca todos os clans únicos cadastrados (agora pode haver múltiplos usuários por clan)
    const clans = await prisma.clan.findMany({
      select: {
        tag: true,
      },
      distinct: ["tag"], // Garante que não há duplicatas
    });

    if (clans.length === 0) {
      return;
    }

    let totalPlayersAdded = 0;
    let clansProcessed = 0;

    // Para cada clan, busca os membros
    for (const clan of clans) {
      try {
        const { data: clanData } = await apiClient.get(
          `/clans/${encodeURIComponent(clan.tag)}`
        );

        if (!clanData?.memberList || clanData.memberList.length === 0) {
          continue;
        }

        // Adiciona cada membro ao playerSnapshot (sem duplicatas)
        for (const member of clanData.memberList) {
          const wasAdded = await addPlayerToSnapshot(member.tag, member.name);
          if (wasAdded) {
            totalPlayersAdded++;
          }
        }

        clansProcessed++;
      } catch (error: any) {
        // Log apenas erros que não são rate limit
        if (!error.message?.includes("429") && error.response?.status !== 429) {
          console.error(`Erro ao processar clan ${clan.tag}:`, error.message?.substring(0, 100));
        }
        // Continua com o próximo clan mesmo se houver erro
      }
    }

    // Log resumo apenas
    if (totalPlayersAdded > 0) {
      console.log(`📊 Scheduler: ${totalPlayersAdded} novos jogadores de ${clansProcessed} clans adicionados ao snapshot`);
    }
  } catch (error: any) {
    console.error("Erro no scheduler de membros:", error.message);
  }
}

/**
 * Inicia o scheduler periódico
 */
export function startClanMembersScheduler() {
  // Executa imediatamente
  scheduleClanMembersMonitoring();

  // Depois executa a cada 5 minutos (300000ms)
  const interval = setInterval(() => {
    scheduleClanMembersMonitoring();
  }, 300000);

  console.log("🔄 Scheduler de membros dos clans iniciado (executa a cada 5 minutos)");

  // Retorna função para parar o scheduler
  return () => {
    clearInterval(interval);
    console.log("⏹️ Scheduler de membros dos clans parado");
  };
}
