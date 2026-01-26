import { z } from "zod";

export namespace SeasonModel {
  export const setSeasonEndDateBody = z.object({
    scheduledAt: z.string().datetime(),
  });

  export type SetSeasonEndDateBody = z.infer<typeof setSeasonEndDateBody>;

  export const seasonConfigResponse = z.object({
    id: z.string(),
    scheduledAt: z.string().datetime(),
    isProcessed: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

  export type SeasonConfigResponse = z.infer<typeof seasonConfigResponse>;

  export const playerSeasonData = z.object({
    id: z.string(),
    playerTag: z.string(),
    playerName: z.string(),
    clanTag: z.string(),
    seasonId: z.string(),
    rank: z.number().nullable(),
    trophies: z.number(),
    configId: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

  export type PlayerSeasonData = z.infer<typeof playerSeasonData>;

  export const seasonsByClanResponse = z.array(
    z.object({
      seasonId: z.string(),
      scheduledAt: z.string().datetime(),
      playerCount: z.number(),
    })
  );

  export const logsBySeasonResponse = z.object({
    seasonId: z.string(),
    scheduledAt: z.string().datetime(),
    players: z.array(playerSeasonData),
  });

  export const getLogsBySeasonQuery = z.object({
    clanTag: z.string(),
  });

  export type GetLogsBySeasonQuery = z.infer<typeof getLogsBySeasonQuery>;

  export const fetchSeasonDataBody = z.object({
    configId: z.string(),
  });

  export type FetchSeasonDataBody = z.infer<typeof fetchSeasonDataBody>;

  export const fetchSeasonDataResponse = z.object({
    success: z.boolean(),
    totalPlayersSaved: z.number(),
    message: z.string().optional(),
  });

  export type FetchSeasonDataResponse = z.infer<typeof fetchSeasonDataResponse>;

  export const errorResponse = z.object({
    error: z.string(),
  });
}

