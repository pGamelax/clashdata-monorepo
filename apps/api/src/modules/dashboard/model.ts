import { z } from "zod";

export namespace DashboardModel {
  // Query para obter dados do dashboard
  export const getDashboardQuery = z.object({
    clanTag: z.string().min(1, "Tag do clan é obrigatória"),
    limit: z.string().optional().transform((val) => val ? Number(val) : undefined),
    offset: z.string().optional().transform((val) => val ? Number(val) : undefined),
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

  // Query para obter guerra atual
  export const getCurrentWarQuery = z.object({
    clanTag: z.string().min(1, "Tag do clan é obrigatória"),
  });

  export type GetCurrentWarQuery = z.infer<typeof getCurrentWarQuery>;

  // Resposta da guerra atual (pode ser null se não houver guerra)
  export const getCurrentWarResponse = z.any().nullable();

  export type GetCurrentWarResponse = z.infer<typeof getCurrentWarResponse>;

  // Query para obter histórico de guerras
  export const getWarHistoryQuery = z.object({
    clanTag: z.string().min(1, "Tag do clan é obrigatória"),
    limit: z.string().optional().transform((val) => val ? Number(val) : undefined),
    offset: z.string().optional().transform((val) => val ? Number(val) : undefined),
  });

  export type GetWarHistoryQuery = z.infer<typeof getWarHistoryQuery>;

  // Resposta do histórico de guerras
  export const getWarHistoryResponse = z.object({
    items: z.array(z.any()), // Array de guerras do clashk.ing
    total: z.number().optional(), // Total de itens disponíveis
    hasMore: z.boolean().optional(), // Indica se há mais itens
  });

  export type GetWarHistoryResponse = z.infer<typeof getWarHistoryResponse>;

  // Query para obter dados de CWL de uma season
  export const getCWLSeasonQuery = z.object({
    clanTag: z.string().min(1, "Tag do clan é obrigatória"),
    season: z.string().regex(/^\d{4}-\d{2}$/, "Season deve estar no formato YYYY-MM"),
  });

  export type GetCWLSeasonQuery = z.infer<typeof getCWLSeasonQuery>;

  // Query para obter dados de CWL da última season
  export const getCWLLatestSeasonQuery = z.object({
    clanTag: z.string().min(1, "Tag do clan é obrigatória"),
  });

  export type GetCWLLatestSeasonQuery = z.infer<typeof getCWLLatestSeasonQuery>;

  // Resposta de dados de CWL de uma season
  export const getCWLSeasonResponse = z.any(); // Estrutura complexa da API clashk.ing
  export type GetCWLSeasonResponse = z.infer<typeof getCWLSeasonResponse>;

  // Query para obter dados de guerras normais
  export const getNormalWarsQuery = z.object({
    clanTag: z.string().min(1, "Tag do clan é obrigatória"),
    months: z.preprocess(
      (val) => {
        // Se é undefined, retorna undefined
        if (val === undefined || val === null) return undefined;
        
        // Se já é um array, retorna direto
        if (Array.isArray(val)) {
          return val;
        }
        
        // Se é string, pode ser separada por vírgulas
        if (typeof val === "string") {
          // Se contém vírgula, separa
          if (val.includes(",")) {
            return val.split(",").map(m => m.trim()).filter(m => m.length > 0);
          }
          // Se não contém vírgula, retorna como array com um elemento
          return [val.trim()].filter(m => m.length > 0);
        }
        
        return undefined;
      },
      z.array(z.string()).optional()
    ),
  });

  export type GetNormalWarsQuery = z.infer<typeof getNormalWarsQuery>;

  // Resposta de dados de guerras normais
  export const getNormalWarsResponse = z.object({
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
    totalNormalWars: z.number(),
  });

  export type GetNormalWarsResponse = z.infer<typeof getNormalWarsResponse>;
}
