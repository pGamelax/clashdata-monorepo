import { prisma } from "@/lib/prisma";
import { apiClient } from "@/config/api-client";

export class LegendLogService {
  async getPlayerLogs({
    playerTag,
    limit = 50,
    offset = 0,
  }: {
    playerTag: string;
    limit?: number;
    offset?: number;
  }) {
    const [logs, total] = await Promise.all([
      prisma.legendLog.findMany({
        where: {
          playerTag: playerTag,
        },
        orderBy: {
          timestamp: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.legendLog.count({
        where: {
          playerTag: playerTag,
        },
      }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        playerTag: log.playerTag,
        playerName: log.playerName,
        clanTag: log.clanTag,
        type: log.type,
        diff: log.diff,
        trophiesResult: log.trophiesResult,
        timestamp: log.timestamp.toISOString(),
      })),
      total,
      limit,
      offset,
    };
  }

  async getClanLogs({
    clanTag,
    limit = 100,
    offset = 0,
  }: {
    clanTag: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      // Busca o clan na API da Supercell
      const { data: clanData } = await apiClient.get(
        `/clans/${encodeURIComponent(clanTag)}`
      );

      if (!clanData?.memberList || clanData.memberList.length === 0) {
        return {
          clanName: clanData?.name || null,
          clanTag: clanTag,
          players: [],
          total: 0,
          limit,
          offset,
        };
      }

      // Extrai as tags dos jogadores
      const playerTags = clanData.memberList.map((member: any) => member.tag);

      // Busca todos os logs dos jogadores do clan
      const allLogs = await prisma.legendLog.findMany({
        where: {
          clanTag: clanTag,
          playerTag: {
            in: playerTags,
          },
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      // Conta total de logs
      const total = allLogs.length;

      // Agrupa logs por jogador
      const logsByPlayer = new Map<string, typeof allLogs>();
      for (const log of allLogs) {
        if (!logsByPlayer.has(log.playerTag)) {
          logsByPlayer.set(log.playerTag, []);
        }
        logsByPlayer.get(log.playerTag)!.push(log);
      }

      // Cria estrutura de resposta com informações dos jogadores
      // Retorna todos os jogadores, mesmo aqueles sem logs
      const players = clanData.memberList
        .map((member: any) => {
          const playerLogs = logsByPlayer.get(member.tag) || [];
          return {
            playerTag: member.tag,
            playerName: member.name,
            townHallLevel: member.townHallLevel,
            trophies: member.trophies,
            role: member.role,
            logs: playerLogs.map((log) => ({
              id: log.id,
              playerTag: log.playerTag,
              playerName: log.playerName,
              clanTag: log.clanTag,
              type: log.type,
              diff: log.diff,
              trophiesResult: log.trophiesResult,
              timestamp: log.timestamp.toISOString(),
            })),
            totalLogs: playerLogs.length,
          };
        })
        .sort((a: { totalLogs: number }, b: { totalLogs: number }) => b.totalLogs - a.totalLogs); // Ordena por total de logs (decrescente)

      return {
        clanName: clanData.name,
        clanTag: clanTag,
        players,
        total,
        limit,
        offset,
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar logs do clan: ${error.message}`);
    }
  }

  async deleteAllLogs(): Promise<{ deletedCount: number }> {
    const deletedCount = await prisma.legendLog.deleteMany({});
    return { deletedCount: deletedCount.count };
  }
}

