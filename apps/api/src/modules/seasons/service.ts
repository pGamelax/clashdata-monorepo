import { prisma } from "@/lib/prisma";
import { apiClient } from "@/config/api-client";
import { NotFound } from "@/errors/Errors";
import { addPlayerToSnapshot } from "@/utils/queue-player";
import { redisConnection } from "@/config/redis";

export class SeasonService {
  async getAllConfigs() {
    const configs = await prisma.seasonConfig.findMany({
      orderBy: {
        scheduledAt: "desc",
      },
    });

    return configs.map((config) => ({
      id: config.id,
      scheduledAt: config.scheduledAt.toISOString(),
      isProcessed: config.isProcessed,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    }));
  }

  async setSeasonEndDate(scheduledAt: Date) {
    const config = await prisma.seasonConfig.create({
      data: {
        scheduledAt,
        isProcessed: false,
      },
    });

    // Agenda automaticamente o worker
    const { scheduleSeasonDataFetch } = await import("@/workers/season-scheduler");
    await scheduleSeasonDataFetch(config.id);

    return {
      id: config.id,
      scheduledAt: config.scheduledAt.toISOString(),
      isProcessed: config.isProcessed,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  async fetchAndSaveSeasonData(configId: string) {
    // Busca a configuração da temporada
    const seasonConfig = await prisma.seasonConfig.findUnique({
      where: { id: configId },
    });

    if (!seasonConfig) {
      throw new Error(`Configuração de temporada ${configId} não encontrada`);
    }

    if (seasonConfig.isProcessed) {
      return {
        success: true,
        totalPlayersSaved: 0,
        message: "Já processado",
      };
    }

    // Busca todos os clans cadastrados
    const clans = await prisma.clan.findMany({
      select: { tag: true },
      distinct: ["tag"],
    });

    let totalPlayersSaved = 0;

    // Para cada clan, busca os jogadores e salva o previousSeason
    for (const clan of clans) {
      try {
        // Busca informações do clan
        const { data: clanData } = await apiClient.get(
          `/clans/${encodeURIComponent(clan.tag)}`
        );

        if (!clanData?.memberList || clanData.memberList.length === 0) {
          continue;
        }

        // Para cada membro, busca os dados do jogador e coleta previousSeason
        for (const member of clanData.memberList) {
          try {
            const { data: playerData } = await apiClient.get(
              `/players/${encodeURIComponent(member.tag)}`
            );

            // Adiciona o jogador ao playerSnapshot (independente de ter previousSeason)
            await addPlayerToSnapshot(member.tag, playerData.name);

            // Verifica se tem previousSeason
            if (playerData.legendStatistics?.previousSeason) {
              const previousSeason = playerData.legendStatistics.previousSeason;

              // Salva os dados do jogador
              await prisma.playerSeason.upsert({
                where: {
                  playerTag_seasonId_configId: {
                    playerTag: member.tag,
                    seasonId: previousSeason.id,
                    configId: configId,
                  },
                },
                update: {
                  playerName: playerData.name,
                  clanTag: clan.tag, // Clan atual do jogador no momento do worker
                  rank: previousSeason.rank || null,
                  trophies: previousSeason.trophies || 0,
                },
                create: {
                  playerTag: member.tag,
                  playerName: playerData.name,
                  clanTag: clan.tag, // Clan atual do jogador no momento do worker
                  seasonId: previousSeason.id, // previousSeason.id
                  rank: previousSeason.rank || null,
                  trophies: previousSeason.trophies || 0,
                  configId: configId,
                },
              });

              totalPlayersSaved++;
            }
          } catch (error: any) {
            // Continua com o próximo jogador mesmo se houver erro
          }
        }
      } catch (error: any) {
        // Continua com o próximo clan mesmo se houver erro
      }
    }

    // Reseta os troféus de TODOS os jogadores no playerSnapshot para 5000
    // Isso corrige o bug onde o sistema calcula ataques negativos após o reset da temporada
    await prisma.playerSnapshot.updateMany({
      data: {
        lastTrophies: 5000,
      },
    });

    // Reseta também o cache do Redis para todos os jogadores
    try {
      const allPlayers = await prisma.playerSnapshot.findMany({
        select: { playerTag: true },
      });
      
      const SNAPSHOT_CACHE_KEY_PREFIX = "cache:snapshot:";
      const CACHE_TTL = 86400; // 24 horas
      
      let cacheResetCount = 0;
      for (const player of allPlayers) {
        try {
          await redisConnection.set(
            `${SNAPSHOT_CACHE_KEY_PREFIX}${player.playerTag}`,
            JSON.stringify({ lastTrophies: 5000 }),
            "EX",
            CACHE_TTL
          );
          cacheResetCount++;
        } catch (error) {
          // Ignora erros individuais de cache
        }
      }
    } catch (error: any) {
      // Não falha o job se o cache falhar
    }

    // Marca a configuração como processada
    await prisma.seasonConfig.update({
      where: { id: configId },
      data: {
        isProcessed: true,
      },
    });

    return {
      success: true,
      totalPlayersSaved,
      playersReset: resetResult.count,
    };
  }

  async getSeasonsByClan(clanTag: string) {
    // Busca todas as seasons únicas que têm dados deste clan
    const uniqueSeasonIds = await prisma.playerSeason.findMany({
      where: {
        clanTag: clanTag,
      },
      select: {
        seasonId: true,
      },
      distinct: ["seasonId"],
    });

    // Para cada seasonId, busca o config mais recente e conta os players
    const seasonsData = await Promise.all(
      uniqueSeasonIds.map(async ({ seasonId }) => {
        // Busca o config mais recente para este seasonId
        const latestPlayerSeason = await prisma.playerSeason.findFirst({
          where: {
            clanTag: clanTag,
            seasonId: seasonId,
          },
          include: {
            config: true,
          },
          orderBy: {
            config: {
              scheduledAt: "desc",
            },
          },
        });

        if (!latestPlayerSeason) {
          return null;
        }

        // Conta todos os players deste seasonId no config mais recente
        const playerCount = await prisma.playerSeason.count({
          where: {
            clanTag: clanTag,
            seasonId: seasonId,
            configId: latestPlayerSeason.configId,
          },
        });

        return {
          seasonId: seasonId,
          scheduledAt: latestPlayerSeason.config.scheduledAt.toISOString(),
          playerCount,
        };
      })
    );

    // Remove nulls e ordena por scheduledAt (mais recente primeiro)
    return seasonsData
      .filter((s): s is { seasonId: string; scheduledAt: string; playerCount: number } => s !== null)
      .sort((a, b) => 
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      );
  }

  async getLogsBySeason(clanTag: string, seasonId: string) {
    // Busca todos os playerSeasons deste clan e seasonId
    // Pode haver múltiplos configs para o mesmo seasonId, então busca o mais recente
    const playerSeasons = await prisma.playerSeason.findMany({
      where: {
        clanTag: clanTag,
        seasonId: seasonId,
      },
      include: {
        config: true,
      },
      orderBy: {
        config: {
          scheduledAt: "desc",
        },
      },
    });

    if (playerSeasons.length === 0) {
      throw new NotFound("Nenhum dado encontrado para esta temporada");
    }

    // Pega o config mais recente
    const latestConfig = playerSeasons[0].config;

    // Filtra apenas os players do config mais recente
    const players = playerSeasons
      .filter((ps) => ps.configId === latestConfig.id)
      .sort((a, b) => (b.trophies || 0) - (a.trophies || 0))
      .map((ps) => ({
        id: ps.id,
        playerTag: ps.playerTag,
        playerName: ps.playerName,
        clanTag: ps.clanTag,
        seasonId: ps.seasonId,
        rank: ps.rank,
        trophies: ps.trophies,
        configId: ps.configId,
        createdAt: ps.createdAt.toISOString(),
        updatedAt: ps.updatedAt.toISOString(),
      }));

    return {
      seasonId: seasonId,
      scheduledAt: latestConfig.scheduledAt.toISOString(),
      players,
    };
  }
}

