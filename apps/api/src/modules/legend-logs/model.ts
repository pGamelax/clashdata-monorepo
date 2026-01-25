import { z } from "zod";

export namespace LegendLogModel {
  // Query para obter logs de um jogador
  export const getLogsQuery = z.object({
    playerTag: z.string().min(1, "Tag do jogador é obrigatória"),
    limit: z.number().int().min(1).max(100).default(50).optional(),
    offset: z.number().int().min(0).default(0).optional(),
  });

  export type GetLogsQuery = z.infer<typeof getLogsQuery>;

  // Resposta de um log individual
  export const logResponse = z.object({
    id: z.number(),
    playerTag: z.string(),
    playerName: z.string(),
    clanTag: z.string().nullable(),
    type: z.enum(["ATTACK", "DEFENSE"]),
    diff: z.number(),
    trophiesResult: z.number(),
    timestamp: z.string(),
  });

  export type LogResponse = z.infer<typeof logResponse>;

  // Resposta com lista de logs
  export const logsResponse = z.object({
    logs: z.array(logResponse),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  });

  export type LogsResponse = z.infer<typeof logsResponse>;

  // Query para obter logs de um clan
  export const getClanLogsQuery = z.object({
    clanTag: z.string().min(1, "Tag do clan é obrigatória"),
    limit: z.number().int().min(1).max(100).default(50).optional(),
    offset: z.number().int().min(0).default(0).optional(),
  });

  export type GetClanLogsQuery = z.infer<typeof getClanLogsQuery>;

  // Resposta com logs de um clan (já processados e agrupados por data)
  export const clanLogsResponse = z.object({
    clanName: z.string(),
    clanTag: z.string(),
    dates: z.array(z.string()), // Datas ordenadas (mais recente primeiro)
    datesData: z.record(z.string(), z.array(
      z.object({
        playerTag: z.string(),
        playerName: z.string(),
        gain: z.number(),
        gainCount: z.number(),
        loss: z.number(),
        lossCount: z.number(),
        final: z.number(),
        logs: z.array(
          z.object({
            id: z.number(),
            type: z.enum(["ATTACK", "DEFENSE"]),
            diff: z.number(),
            trophiesResult: z.number(),
            timestamp: z.string(),
          })
        ),
      })
    )),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  });

  export type ClanLogsResponse = z.infer<typeof clanLogsResponse>;

  // Respostas de erro padronizadas
  export const errorResponse = z.object({
    message: z.string(),
  });

  export type ErrorResponse = z.infer<typeof errorResponse>;

  // Resposta de delete de todos os logs
  export const deleteAllLogsResponse = z.object({
    deletedCount: z.number(),
    message: z.string(),
  });

  export type DeleteAllLogsResponse = z.infer<typeof deleteAllLogsResponse>;

  // Resposta com ranking do clan
  export const clanRankingResponse = z.object({
    clanName: z.string(),
    clanTag: z.string(),
    players: z.array(
      z.object({
        rank: z.number(),
        playerTag: z.string(),
        playerName: z.string(),
        townHallLevel: z.number(),
        trophies: z.number(),
        bestTrophies: z.number(),
        expLevel: z.number(),
        role: z.string(),
        leagueTier: z
          .object({
            id: z.number(),
            name: z.string(),
            iconUrls: z
              .object({
                small: z.string().optional(),
                large: z.string().optional(),
              })
              .optional(),
          })
          .nullable(),
      })
    ),
  });

  export type ClanRankingResponse = z.infer<typeof clanRankingResponse>;
}
