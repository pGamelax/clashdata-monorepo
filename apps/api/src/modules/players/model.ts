import { z } from "zod";

export namespace PlayerModel {
  // Query para obter informações do jogador
  export const getPlayerInfoQuery = z.object({
    playerTag: z.string().min(1, "Tag do jogador é obrigatória"),
  });

  export type GetPlayerInfoQuery = z.infer<typeof getPlayerInfoQuery>;

  // Resposta da API Supercell para informações do jogador
  export const getPlayerInfoResponse = z.object({
    tag: z.string(),
    name: z.string(),
    townHallLevel: z.number(),
    expLevel: z.number(),
    trophies: z.number(),
    bestTrophies: z.number(),
    warStars: z.number(),
    attackWins: z.number(),
    defenseWins: z.number(),
    builderHallLevel: z.number().optional(),
    builderBaseTrophies: z.number().optional(),
    versusTrophies: z.number().optional(),
    role: z.string().optional(),
    warPreference: z.string().optional(),
    donations: z.number(),
    donationsReceived: z.number(),
    clan: z
      .object({
        tag: z.string(),
        name: z.string(),
        clanLevel: z.number(),
        badgeUrls: z.object({
          small: z.string(),
          medium: z.string(),
          large: z.string(),
        }),
      })
      .optional(),
    leagueTier: z
      .object({
        id: z.number(),
        name: z.string(),
        iconUrls: z.object({
          small: z.string(),
          large: z.string(),
        }),
      })
      .optional(),
    achievements: z.array(z.any()),
    versusBattleWinCount: z.number().optional(),
    labels: z.array(z.any()),
    troops: z.array(z.any()),
    heroes: z.array(z.any()),
    spells: z.array(z.any()),
  });

  export type GetPlayerInfoResponse = z.infer<typeof getPlayerInfoResponse>;

  // Query para histórico de guerra
  export const getWarHistoryQuery = z.object({
    playerTag: z.string().min(1, "Tag do jogador é obrigatória"),
  });

  export type GetWarHistoryQuery = z.infer<typeof getWarHistoryQuery>;

  // Resposta da API clashk.ing para histórico de guerra
  export const getWarHistoryResponse = z.object({
    items: z.array(
      z.object({
        // Dados do membro agora dentro de member_data
        member_data: z.object({
          tag: z.string(),
          name: z.string(),
          townhallLevel: z.number(), // 'h' minúsculo
          mapPosition: z.number(),
          opponentAttacks: z.number().optional(),
        }),

        // Dados da guerra (opcional, mas bom ter no schema)
        war_data: z.object({
          state: z.string(),
          teamSize: z.number(),
          clan: z.object({
            tag: z.string(),
            name: z.string(),
          }).passthrough(),
        }).passthrough().optional(),

        // Array de ataques corrigido
        attacks: z.array(
          z.object({
            attackerTag: z.string(),
            defenderTag: z.string(),
            stars: z.number(),
            destructionPercentage: z.number(),
            duration: z.number(),
            order: z.number(),
            // Se você precisar do nome do defensor:
            defender: z.object({
              name: z.string(),
              townhallLevel: z.number(),
            }).optional(),
          })
        ).optional(),

        // Array de defesas (vimos que existe no JSON real)
        defenses: z.array(z.any()).optional(),
      })
    ),
  });

  export type GetWarHistoryResponse = z.infer<typeof getWarHistoryResponse>;

  // Respostas de erro padronizadas
  export const errorResponse = z.object({
    message: z.string(),
  });

  export type ErrorResponse = z.infer<typeof errorResponse>;
}
