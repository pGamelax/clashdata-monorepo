import { z } from "zod";

export namespace DashboardModel {
  // Query para obter dados do dashboard
  export const getDashboardQuery = z.object({
    clanTag: z.string().min(1, "Tag do clan é obrigatória"),
    limit: z.string().optional().transform((val) => val ? Number(val) : undefined),
  });

  export type GetDashboardQuery = z.infer<typeof getDashboardQuery>;

  // Resposta do dashboard com dados de guerra
  export const getDashboardResponse = z.object({
    players: z.array(
      z.object({
        tag: z.string(),
        name: z.string(),
        townhallLevel: z.number(),
        allAttacks: z.array(
          z.object({
            date: z.string(),
            stars: z.number().min(0).max(3),
            destruction: z.number().min(0).max(100),
            opponent: z.string(),
          })
        ),
        allDefenses: z.array(
          z.object({
            date: z.string(),
            stars: z.number().min(0).max(3),
            destruction: z.number().min(0).max(100),
          })
        ),
      })
    ),
    cwlPlayers: z.array(
      z.object({
        tag: z.string(),
        name: z.string(),
        townhallLevel: z.number(),
        allAttacks: z.array(
          z.object({
            date: z.string(),
            stars: z.number().min(0).max(3),
            destruction: z.number().min(0).max(100),
            opponent: z.string(),
          })
        ),
        allDefenses: z.array(
          z.object({
            date: z.string(),
            stars: z.number().min(0).max(3),
            destruction: z.number().min(0).max(100),
          })
        ),
      })
    ),
  });

  export type GetDashboardResponse = z.infer<typeof getDashboardResponse>;

  // Respostas de erro padronizadas
  export const errorResponse = z.object({
    message: z.string(),
  });

  export type ErrorResponse = z.infer<typeof errorResponse>;
}
