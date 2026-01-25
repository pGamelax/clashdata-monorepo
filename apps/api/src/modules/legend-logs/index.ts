import { betterAuthPlugin } from "@/http/plugins/better-auth";
import { adminPlugin } from "@/http/plugins/admin-auth";
import { Elysia } from "elysia";
import { LegendLogModel } from "./model";
import { LegendLogService } from "./service";
import { addPlayerToSnapshotAndQueue } from "@/utils/queue-player";
import { verifyClanOwnership } from "@/utils/verify-clan-ownership";

// Helper para normalizar tags (adiciona # se não tiver)
function normalizeTag(tag: string): string {
  return tag.startsWith("#") ? tag : `#${tag}`;
}

export const legendLogs = new Elysia({ prefix: "/legend-logs" })
  .use(betterAuthPlugin)
  .use(adminPlugin)
  .get(
    "/player",
    async ({ query }) => {
      const { playerTag } = query;
      // Aumenta o limite padrão para buscar todos os logs desde o início da temporada
      const limit = query.limit || 10000; // Limite muito alto para pegar todos os logs
      const offset = query.offset || 0;

      const normalizedTag = normalizeTag(playerTag);

      // Adiciona o jogador ao snapshot e à fila de monitoramento
      // Faz isso de forma assíncrona para não bloquear a resposta
      addPlayerToSnapshotAndQueue(normalizedTag).catch(() => {
        // Ignora erros ao adicionar ao snapshot/queue
      });

      const legendLogService = new LegendLogService();
      const result = await legendLogService.getPlayerLogs({
        playerTag: normalizedTag,
        limit,
        offset,
      });

      return result;
    },
    {
      auth: true,
      detail: {
        summary: "Obter logs de ataques e defesas de um jogador",
        description:
          "Retorna os logs de ataques e defesas de um jogador na Legend League. " +
          "Os logs mostram a diferença de troféus (+ para ataques, - para defesas).",
        tags: ["Legend Logs"],
        examples: [
          {
            summary: "Exemplo de resposta",
            description: "Logs de ataques e defesas",
            value: {
              logs: [
                {
                  id: 1,
                  playerTag: "#ABC123",
                  playerName: "Player Name",
                  clanTag: "#CLAN123",
                  type: "ATTACK",
                  diff: 30,
                  trophiesResult: 5430,
                  timestamp: "2024-01-15T10:30:00Z",
                },
                {
                  id: 2,
                  playerTag: "#ABC123",
                  playerName: "Player Name",
                  clanTag: "#CLAN123",
                  type: "DEFENSE",
                  diff: -20,
                  trophiesResult: 5410,
                  timestamp: "2024-01-15T10:25:00Z",
                },
              ],
              total: 2,
              limit: 50,
              offset: 0,
            },
          },
        ],
      },
      query: LegendLogModel.getLogsQuery,
      response: {
        200: LegendLogModel.logsResponse,
        400: LegendLogModel.errorResponse,
        404: LegendLogModel.errorResponse,
      },
    }
  )
  .get(
    "/clan",
    async ({ query, user, set }) => {
      try {
        const { clanTag } = query;
        const limit = query.limit || 50; // Limite padrão reduzido para performance
        const offset = query.offset || 0;

        const normalizedTag = normalizeTag(clanTag);

        // Verifica se o clan pertence ao usuário logado
        await verifyClanOwnership(normalizedTag, user.id);

        const legendLogService = new LegendLogService();
        const result = await legendLogService.getClanLogs({
          clanTag: normalizedTag,
          limit,
          offset,
        });

        return result;
      } catch (error: any) {
        set.status = 500;
        return {
          error: error.message || "Erro ao buscar logs do clan",
          message: "Ocorreu um erro ao processar a requisição. Tente novamente mais tarde.",
        };
      }
    },
    {
      auth: true,
      detail: {
        summary: "Obter logs de ataques e defesas de todos os jogadores de um clan",
        description:
          "Busca o clan na API da Supercell, obtém todos os membros e retorna os logs de ataques e defesas " +
          "de cada jogador que está na Legend League. Os logs são agrupados por jogador.",
        tags: ["Legend Logs"],
        examples: [
          {
            summary: "Exemplo de resposta",
            description: "Logs agrupados por jogador",
            value: {
              clanName: "Clan Name",
              clanTag: "#CLAN123",
              players: [
                {
                  playerTag: "#ABC123",
                  playerName: "Player Name",
                  townHallLevel: 15,
                  trophies: 5430,
                  role: "member",
                  logs: [
                    {
                      id: 1,
                      playerTag: "#ABC123",
                      playerName: "Player Name",
                      clanTag: "#CLAN123",
                      type: "ATTACK",
                      diff: 30,
                      trophiesResult: 5430,
                      timestamp: "2024-01-15T10:30:00Z",
                    },
                  ],
                  totalLogs: 1,
                },
              ],
              total: 1,
              limit: 100,
              offset: 0,
            },
          },
        ],
      },
      query: LegendLogModel.getClanLogsQuery,
      response: {
        200: LegendLogModel.clanLogsResponse,
        400: LegendLogModel.errorResponse,
        403: LegendLogModel.errorResponse,
        404: LegendLogModel.errorResponse,
      },
    }
  )
  .get(
    "/clan-ranking",
    async ({ query, user }) => {
      const { clanTag } = query;

      const normalizedTag = normalizeTag(clanTag);

      // Verifica se o clan pertence ao usuário logado
      await verifyClanOwnership(normalizedTag, user.id);

      const legendLogService = new LegendLogService();
      const result = await legendLogService.getClanRanking({
        clanTag: normalizedTag,
      });

      return result;
    },
    {
      auth: true,
      detail: {
        summary: "Obter ranking atual dos jogadores do clan",
        description:
          "Busca o clan na API da Supercell e retorna os jogadores ordenados por troféus (ranking atual). " +
          "Os dados são atualizados em tempo real da API da Supercell.",
        tags: ["Legend Logs"],
        examples: [
          {
            summary: "Exemplo de resposta",
            description: "Ranking dos jogadores ordenado por troféus",
            value: {
              clanName: "Clan Name",
              clanTag: "#CLAN123",
              players: [
                {
                  rank: 1,
                  playerTag: "#ABC123",
                  playerName: "Player Name",
                  townHallLevel: 15,
                  trophies: 5430,
                  bestTrophies: 5600,
                  expLevel: 200,
                  role: "leader",
                  league: {
                    id: 29000022,
                    name: "Legend League",
                  },
                },
              ],
            },
          },
        ],
      },
      query: LegendLogModel.getClanLogsQuery,
      response: {
        200: LegendLogModel.clanRankingResponse,
        400: LegendLogModel.errorResponse,
        403: LegendLogModel.errorResponse,
        404: LegendLogModel.errorResponse,
      },
    }
  )
  .delete(
    "/all",
    async () => {
      const legendLogService = new LegendLogService();
      const result = await legendLogService.deleteAllLogs();

      return {
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} logs deletados com sucesso`,
      };
    },
    {
      auth: true,
      admin: true,
      detail: {
        summary: "Deletar todos os logs (Apenas Admin)",
        description:
          "Deleta todos os logs de ataques e defesas da Legend League do banco de dados. " +
          "Esta operação é irreversível e requer permissões de administrador.",
        tags: ["Legend Logs", "Admin"],
        examples: [
          {
            summary: "Exemplo de resposta",
            description: "Resposta após deletar todos os logs",
            value: {
              deletedCount: 1500,
              message: "1500 logs deletados com sucesso",
            },
          },
        ],
      },
      response: {
        200: LegendLogModel.deleteAllLogsResponse,
        401: LegendLogModel.errorResponse,
        403: LegendLogModel.errorResponse,
      },
    }
  );

