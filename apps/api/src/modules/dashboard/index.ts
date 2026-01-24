import { betterAuthPlugin } from "@/http/plugins/better-auth";
import { Elysia } from "elysia";
import { DashboardModel } from "./model";
import { DashboardService } from "./service";

const dashboardService = new DashboardService();

// Helper para normalizar tags (adiciona # se não tiver)
function normalizeTag(tag: string): string {
  return tag.startsWith("#") ? tag : `#${tag}`;
}

export const dashboard = new Elysia({ prefix: "/dashboard" })
  .use(betterAuthPlugin)
  .get(
    "/data",
    async ({ query, user }) => {
      const { clanTag } = query;
      const normalizedTag = normalizeTag(clanTag);

      const dashboard = await dashboardService.getDashboardFromAPI({
        clanTag: normalizedTag,
        userId: user.id,
      });

      return dashboard;
    },
    {
      auth: true,
      detail: {
        summary: "Obter dados do dashboard de guerra",
        description:
          "Retorna dados agregados de guerra de todos os jogadores de um clan cadastrado. " +
          "Inclui histórico de ataques e defesas das últimas 50 guerras. " +
          "Apenas o dono do clan pode acessar essas informações.",
        tags: ["Dashboard"],
        examples: [
          {
            summary: "Exemplo de requisição",
            description: "Buscar dados do dashboard de um clan",
            value: {
              clanTag: "#CLAN123",
            },
          },
          {
            summary: "Exemplo de resposta",
            description: "Dados do dashboard com jogadores e estatísticas de guerra",
            value: {
              players: [
                {
                  tag: "#ABC123",
                  name: "Player Name",
                  townhallLevel: 15,
                  allAttacks: [
                    {
                      date: "2024-01-15T10:30:00Z",
                      stars: 3,
                      destruction: 100,
                      opponent: "Enemy Clan",
                    },
                  ],
                  allDefenses: [
                    {
                      date: "2024-01-15T10:25:00Z",
                      stars: 2,
                      destruction: 85,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      query: DashboardModel.getDashboardQuery,
      response: {
        200: DashboardModel.getDashboardResponse,
        400: DashboardModel.errorResponse,
        403: DashboardModel.errorResponse,
      },
    },
  );
