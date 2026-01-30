import { z } from "zod";

export namespace ClanModel {
  export const clan = z.object({
    id: z.string(),
    name: z.string(),
    tag: z.string(),
    createdAt: z.coerce.string(),
    updatedAt: z.coerce.string(),
  });

  export type Clan = z.infer<typeof clan>;

  export const createBody = z.object({
    clanTag: z.string().startsWith("#", "Clan tag must be start with #"),
    userEmail: z.email("Invalid email"),
  });

  export type CreateBody = z.infer<typeof createBody>;

  export const createResponse = z.object({
    id: z.string(),
    name: z.string(),
    tag: z.string(),
    createdAt: z.coerce.string(),
    updatedAt: z.coerce.string(),
  });

  export type CreateResponse = z.infer<typeof createResponse>;

  export const createInvalid = z.literal("Invalid clan tag or owner email");
  export type CreateInvalid = z.infer<typeof createInvalid>;

  export const startQueueBody = z.object({
    clanTag: z.string().startsWith("#", "Clan tag must be start with #"),
  });

  export type StartQueueBody = z.infer<typeof startQueueBody>;

  export const startQueueResponse = z.object({
    message: z.string(),
  });

  export type StartQueueResponse = z.infer<typeof startQueueResponse>;

  export const startQueueInvalid = z.literal("Invalid clan tag");
  export type StartQueueInvalid = z.infer<typeof startQueueInvalid>;

  // Query para obter informações do clan
  export const getClanInfoQuery = z.object({
    clanTag: z.string().min(1, "Tag do clan é obrigatória").refine(
      (tag) => tag && tag.trim().length > 0,
      { message: "Tag do clan não pode estar vazia" }
    ),
  });

  export type GetClanInfoQuery = z.infer<typeof getClanInfoQuery>;

  export const clanInfoResponse = z.object({
    name: z.string(),
    tag: z.string(),
    description: z.string(),
    type: z.string().optional(),
    location: z.object({
      id: z.number(),
      name: z.string(),
      isCountry: z.boolean(),
      countryCode: z.string(),
    }).optional(),
    isFamilyFriendly: z.boolean().optional(),
    badgeUrls: z.object({
      small: z.string(),
      medium: z.string(),
      large: z.string(),
    }),
    clanLevel: z.number().optional(),
    clanPoints: z.number().optional(),
    clanBuilderBasePoints: z.number().optional(),
    clanCapitalPoints: z.number().optional(),
    capitalLeague: z.object({
      id: z.number(),
      name: z.string(),
    }).optional(),
    requiredTrophies: z.number().optional(),
    warFrequency: z.string().optional(),
    warWinStreak: z.number().optional(),
    totalWars: z.number(),
    warWins: z.number(),
    warTies: z.number(),
    warLosses: z.number(),
    isWarLogPublic: z.boolean().optional(),
    warLeague: z.object({
      id: z.number(),
      name: z.string(),
    }).optional(),
    members: z.number().optional(),
  });

  export type ClanInfoResponse = z.infer<typeof clanInfoResponse>;

  export const clanInfoInvalid = z.literal("Invalid clan tag");
  export type ClanInfoInvalid = z.infer<typeof clanInfoInvalid>;

  // Resposta com lista de clans do usuário
  export const getAllClansResponse = z.array(clan);

  export type GetAllClansResponse = z.infer<typeof getAllClansResponse>;

  // Respostas de erro padronizadas
  export const errorResponse = z.object({
    message: z.string(),
  });

  export type ErrorResponse = z.infer<typeof errorResponse>;
}
