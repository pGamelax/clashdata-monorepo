import { prisma } from "@/lib/prisma";
import { apiClient } from "@/config/api-client";
import { getDateKeyForSaoPaulo } from "@/lib/date-utils";

export class LegendLogService {
  async getPlayerLogs({
    playerTag,
    limit = 10000,
    offset = 0,
  }: {
    playerTag: string;
    limit?: number;
    offset?: number;
  }) {
    // Busca logs do banco de dados
    const logs = await prisma.legendLog.findMany({
      where: {
        playerTag: playerTag,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.legendLog.count({
      where: {
        playerTag: playerTag,
      },
    });

    // Converte para o formato esperado
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      playerTag: log.playerTag,
      playerName: log.playerName,
      clanTag: log.clanTag,
      type: log.type as "ATTACK" | "DEFENSE",
      diff: log.diff,
      trophiesResult: log.trophiesResult,
      timestamp: log.timestamp.toISOString(),
    }));

    return {
      logs: formattedLogs,
      total,
      limit,
      offset,
    };
  }

  async getClanLogs({
    clanTag,
    limit = 50,
    offset = 0,
  }: {
    clanTag: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      // Busca o clan na API da Supercell apenas para obter membros
      const { data: clanData } = await apiClient.get(
        `/clans/${encodeURIComponent(clanTag)}`
      );

      if (!clanData?.memberList || clanData.memberList.length === 0) {
        return {
          clanName: clanData?.name || "",
          clanTag: clanTag,
          dates: [],
          datesData: {},
          total: 0,
          limit,
          offset,
        };
      }

      // Busca logs do banco de dados para os jogadores do clan
      const playerTags = clanData.memberList
        .slice(offset, offset + limit)
        .map((member: any) => member.tag);

      if (playerTags.length === 0) {
        return {
          clanName: clanData?.name || "",
          clanTag: clanTag,
          dates: [],
          datesData: {},
          total: 0,
          limit,
          offset,
        };
      }

      // Busca logs do banco de dados
      const logs = await prisma.legendLog.findMany({
        where: {
          playerTag: { in: playerTags },
          clanTag: clanTag,
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      // Processa e agrupa logs por data no backend
      type DayLog = {
        playerTag: string;
        playerName: string;
        gain: number;
        gainCount: number;
        loss: number;
        lossCount: number;
        final: number;
        logs: Array<{
          id: number;
          type: "ATTACK" | "DEFENSE";
          diff: number;
          trophiesResult: number;
          timestamp: string;
        }>;
      };
      
      const playerDateMaps = new Map<string, Map<string, DayLog>>();
      const allDates = new Set<string>();
      const memberMap = new Map<string, any>();
      
      // Cria mapa de membros para acesso rápido
      for (const member of clanData.memberList) {
        memberMap.set(member.tag, member);
      }

      // Processa logs e agrupa por jogador e data
      for (const log of logs) {
        const member = memberMap.get(log.playerTag);
        if (!member) continue;

        const dateKey = getDateKeyForSaoPaulo(log.timestamp);
        allDates.add(dateKey);
        
        if (!playerDateMaps.has(log.playerTag)) {
          playerDateMaps.set(log.playerTag, new Map());
        }
        
        const dateMap = playerDateMaps.get(log.playerTag)!;
        
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, {
            playerTag: log.playerTag,
            playerName: log.playerName,
            gain: 0,
            gainCount: 0,
            loss: 0,
            lossCount: 0,
            final: 0,
            logs: [],
          });
        }
        
        const dayLog = dateMap.get(dateKey)!;
        dayLog.logs.push({
          id: log.id,
          type: log.type,
          diff: log.diff,
          trophiesResult: log.trophiesResult,
          timestamp: log.timestamp.toISOString(),
        });
        
        if (log.type === "ATTACK") {
          if (log.diff > 0) {
            dayLog.gain += log.diff;
            dayLog.gainCount++;
          } else if (log.diff < 0) {
            dayLog.loss += Math.abs(log.diff);
            dayLog.lossCount++;
          }
        } else if (log.type === "DEFENSE") {
          if (log.diff < 0) {
            dayLog.loss += Math.abs(log.diff);
            dayLog.lossCount++;
          } else if (log.diff > 0) {
            dayLog.gain += log.diff;
            dayLog.gainCount++;
          }
        }
      }
      
      // Calcula final para cada dia de cada jogador
      for (const dateMap of playerDateMaps.values()) {
        for (const dayLog of dateMap.values()) {
          if (dayLog.logs.length > 0) {
            // Ordena logs por timestamp e pega o mais recente
            dayLog.logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            dayLog.final = dayLog.logs[0].trophiesResult;
            // Reordena do mais antigo para o mais recente para exibição
            dayLog.logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          }
        }
      }

      // Agrupa por data (todos os jogadores de cada data)
      const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));
      const datesData: Record<string, Array<{
        playerTag: string;
        playerName: string;
        gain: number;
        gainCount: number;
        loss: number;
        lossCount: number;
        final: number;
        logs: Array<{
          id: number;
          type: "ATTACK" | "DEFENSE";
          diff: number;
          trophiesResult: number;
          timestamp: string;
        }>;
      }>> = {};

      for (const dateKey of sortedDates) {
        const playerLogs: Array<{
          playerTag: string;
          playerName: string;
          gain: number;
          gainCount: number;
          loss: number;
          lossCount: number;
          final: number;
          logs: Array<{
            id: number;
            type: "ATTACK" | "DEFENSE";
            diff: number;
            trophiesResult: number;
            timestamp: string;
          }>;
        }> = [];
        
        for (const dateMap of playerDateMaps.values()) {
          const dayLog = dateMap.get(dateKey);
          if (dayLog) {
            playerLogs.push(dayLog);
          }
        }
        
        // Ordena por troféus finais do dia (maior primeiro)
        playerLogs.sort((a, b) => b.final - a.final);
        datesData[dateKey] = playerLogs;
      }

      // Retorna estrutura simplificada com dados já processados
      return {
        clanName: clanData.name,
        clanTag: clanTag,
        dates: sortedDates,
        datesData,
        total: logs.length,
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

  async getClanRanking({ clanTag }: { clanTag: string }) {
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
        };
      }

      // Ordena os membros por troféus (maior primeiro)
      const rankedPlayers = clanData.memberList
        .map((member: any) => ({
          rank: 0, // Será calculado depois
          playerTag: member.tag,
          playerName: member.name,
          townHallLevel: member.townHallLevel || 0,
          trophies: member.trophies || 0,
          bestTrophies: member.bestTrophies || 0,
          expLevel: member.expLevel || 0,
          role: member.role || "member",
          leagueTier: member.leagueTier ? {
            id: member.leagueTier.id,
            name: member.leagueTier.name,
            iconUrls: member.leagueTier.iconUrls ? {
              small: member.leagueTier.iconUrls.small,
              large: member.leagueTier.iconUrls.large,
            } : undefined,
          } : null,
        }))
        .sort((a: { trophies: number }, b: { trophies: number }) => b.trophies - a.trophies)
        .map((player: any, index: number) => ({
          ...player,
          rank: index + 1,
        }));

      return {
        clanName: clanData.name,
        clanTag: clanTag,
        players: rankedPlayers,
      };
    } catch (error: any) {
      throw new Error(`Erro ao buscar ranking do clan: ${error.message}`);
    }
  }
}

