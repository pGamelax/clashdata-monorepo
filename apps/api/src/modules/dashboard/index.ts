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
      const { clanTag, limit, offset } = query;
      const normalizedTag = normalizeTag(clanTag);

      const dashboard = await dashboardService.getDashboardFromAPI({
        clanTag: normalizedTag,
        userId: user.id,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      return dashboard;
    },
    {
      auth: true,
      detail: {
        summary: "Obter dados do dashboard de guerra",
        description:
          "Retorna dados agregados de guerra de todos os jogadores de um clan cadastrado. " +
          "Inclui histórico de ataques e defesas das últimas 50 guerras normais e todas as guerras CWL. " +
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
  )
  .get(
    "/current-war",
    async ({ query, user }) => {
      const { clanTag } = query;
      const normalizedTag = normalizeTag(clanTag);
      
      console.log(`[CurrentWar] Buscando guerra atual para clã: ${clanTag} -> ${normalizedTag}`);

      const currentWar = await dashboardService.getCurrentWar({
        clanTag: normalizedTag,
        userId: user.id,
      });

      console.log(`[CurrentWar] Resposta:`, currentWar ? `Guerra encontrada (state: ${currentWar.state})` : 'Nenhuma guerra encontrada');
      
      return currentWar;
    },
    {
      auth: true,
      detail: {
        summary: "Obter guerra atual do clã",
        description:
          "Retorna dados da guerra atual em andamento do clã. " +
          "Retorna null se não houver guerra em andamento. " +
          "Apenas o dono do clan pode acessar essas informações.",
        tags: ["Dashboard"],
        examples: [
          {
            summary: "Exemplo de requisição",
            description: "Buscar guerra atual de um clan",
            value: {
              clanTag: "#CLAN123",
            },
          },
        ],
      },
      query: DashboardModel.getCurrentWarQuery,
      response: {
        200: DashboardModel.getCurrentWarResponse,
        400: DashboardModel.errorResponse,
        403: DashboardModel.errorResponse,
      },
    },
  )
  .get(
    "/war-history",
    async ({ query, user }) => {
      const { clanTag, limit, offset } = query;
      const normalizedTag = normalizeTag(clanTag);

      const warHistory = await dashboardService.getWarHistory({
        clanTag: normalizedTag,
        userId: user.id,
        limit: limit ? Number(limit) : 10,
        offset: offset ? Number(offset) : 0,
      });

      return warHistory;
    },
    {
      auth: true,
      detail: {
        summary: "Obter histórico de guerras do clã",
        description:
          "Retorna o histórico de guerras anteriores do clã. " +
          "Inclui informações sobre vitórias, derrotas e empates. " +
          "Apenas o dono do clan pode acessar essas informações.",
        tags: ["Dashboard"],
        examples: [
          {
            summary: "Exemplo de requisição",
            description: "Buscar histórico de guerras de um clan",
            value: {
              clanTag: "#CLAN123",
              limit: 50,
            },
          },
        ],
      },
      query: DashboardModel.getWarHistoryQuery,
      response: {
        200: DashboardModel.getWarHistoryResponse,
        400: DashboardModel.errorResponse,
        403: DashboardModel.errorResponse,
      },
    },
  )
  .get(
    "/cwl-season",
    async ({ query, user }) => {
      const { clanTag, season } = query;
      const normalizedTag = normalizeTag(clanTag);

      const cwlData = await dashboardService.getCWLSeasonData({
        clanTag: normalizedTag,
        userId: user.id,
        season: season as string,
      });

      return cwlData;
    },
    {
      auth: true,
      detail: {
        summary: "Obter dados de CWL de uma season específica",
        description:
          "Retorna dados de CWL de uma season específica do clã. " +
          "Apenas o dono do clan pode acessar essas informações.",
        tags: ["Dashboard"],
        examples: [
          {
            summary: "Exemplo de requisição",
            description: "Buscar dados de CWL de uma season",
            value: {
              clanTag: "#CLAN123",
              season: "2026-01",
            },
          },
        ],
      },
      query: DashboardModel.getCWLSeasonQuery,
      response: {
        200: DashboardModel.getCWLSeasonResponse,
        400: DashboardModel.errorResponse,
        403: DashboardModel.errorResponse,
      },
    },
  )
  .get(
    "/cwl-latest-season",
    async ({ query, user }) => {
      const { clanTag } = query;
      const normalizedTag = normalizeTag(clanTag);

      const latestSeason = dashboardService.getLatestSeason();
      const cwlData = await dashboardService.getCWLSeasonData({
        clanTag: normalizedTag,
        userId: user.id,
        season: latestSeason,
      });

      return { ...cwlData, season: latestSeason };
    },
    {
      auth: true,
      detail: {
        summary: "Obter dados de CWL da última season",
        description:
          "Retorna dados de CWL da última season do clã. " +
          "Apenas o dono do clan pode acessar essas informações.",
        tags: ["Dashboard"],
        examples: [
          {
            summary: "Exemplo de requisição",
            description: "Buscar dados de CWL da última season",
            value: {
              clanTag: "#CLAN123",
            },
          },
        ],
      },
      query: DashboardModel.getCWLLatestSeasonQuery,
      response: {
        200: DashboardModel.getCWLSeasonResponse,
        400: DashboardModel.errorResponse,
        403: DashboardModel.errorResponse,
      },
    },
  )
  .get(
    "/normal-wars",
    async ({ query, user }) => {
      const { clanTag, limit, offset } = query;
      const normalizedTag = normalizeTag(clanTag);

      const normalWars = await dashboardService.getNormalWarsFromAPI({
        clanTag: normalizedTag,
        userId: user.id,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      return normalWars;
    },
    {
      auth: true,
      detail: {
        summary: "Obter dados de guerras normais",
        description:
          "Retorna dados agregados de guerras normais (não CWL) de um clan. " +
          "Filtra automaticamente guerras CWL e retorna apenas guerras normais. " +
          "Apenas o dono do clan pode acessar essas informações.",
        tags: ["Dashboard"],
        examples: [
          {
            summary: "Exemplo de requisição",
            description: "Buscar dados de guerras normais",
            value: {
              clanTag: "#CLAN123",
              limit: 5,
              offset: 0,
            },
          },
        ],
      },
      query: DashboardModel.getNormalWarsQuery,
      response: {
        200: DashboardModel.getNormalWarsResponse,
        400: DashboardModel.errorResponse,
        403: DashboardModel.errorResponse,
      },
    },
  );
