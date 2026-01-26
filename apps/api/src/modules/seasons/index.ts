import { adminPlugin } from "@/http/plugins/admin-auth";
import { betterAuthPlugin } from "@/http/plugins/better-auth";
import { Elysia } from "elysia";
import { z } from "zod";
import { SeasonModel } from "./model";
import { SeasonService } from "./service";

// Helper para normalizar tags (adiciona # se não tiver)
function normalizeTag(tag: string): string {
  return tag.startsWith("#") ? tag : `#${tag}`;
}

export const seasons = new Elysia({ prefix: "/seasons" })
  .use(betterAuthPlugin)
  .get(
    "/all",
    async ({ user }) => {
      const seasonService = new SeasonService();
      const configs = await seasonService.getAllConfigs();
      return configs;
    },
    {
      auth: true,
      admin: true,
      detail: {
        summary: "Listar todas as configurações de temporada",
        description:
          "Retorna uma lista com todas as configurações de temporada. Apenas administradores podem acessar esta rota.",
        tags: ["Seasons"],
      },
      response: {
        200: z.array(SeasonModel.seasonConfigResponse),
        403: SeasonModel.errorResponse,
      },
    },
  )
  .post(
    "/set-season-end-date",
    async ({ body, user }) => {
      const seasonService = new SeasonService();
      const scheduledAt = new Date(body.scheduledAt);
      const result = await seasonService.setSeasonEndDate(scheduledAt);
      return result;
    },
    {
      auth: true,
      admin: true,
      body: SeasonModel.setSeasonEndDateBody,
      detail: {
        summary: "Agendar worker para buscar dados de temporada",
        description:
          "Define a data/hora para agendar o worker que buscará os dados de previousSeason. Apenas administradores podem acessar esta rota.",
        tags: ["Seasons"],
      },
      response: {
        200: SeasonModel.seasonConfigResponse,
        403: SeasonModel.errorResponse,
      },
    },
  )
  .get(
    "/by-clan/:clanTag",
    async ({ params, user }) => {
      const seasonService = new SeasonService();
      const normalizedTag = normalizeTag(params.clanTag);
      const result = await seasonService.getSeasonsByClan(normalizedTag);
      return result;
    },
    {
      auth: true,
      detail: {
        summary: "Obter seasons de um clan",
        description: "Retorna todas as seasons registradas para um clan específico.",
        tags: ["Seasons"],
      },
      response: {
        200: SeasonModel.seasonsByClanResponse,
      },
    },
  )
  .get(
    "/:seasonId/logs",
    async ({ query, params, user }) => {
      const seasonService = new SeasonService();
      const normalizedTag = normalizeTag(query.clanTag);
      const result = await seasonService.getLogsBySeason(normalizedTag, params.seasonId);
      return result;
    },
    {
      auth: true,
      query: SeasonModel.getLogsBySeasonQuery,
      detail: {
        summary: "Obter logs de uma season específica",
        description: "Retorna os dados dos jogadores de uma season específica para um clan.",
        tags: ["Seasons"],
      },
      response: {
        200: SeasonModel.logsBySeasonResponse,
        404: SeasonModel.errorResponse,
      },
    },
  )
  .post(
    "/fetch-season-data",
    async ({ body, user }) => {
      const seasonService = new SeasonService();
      const result = await seasonService.fetchAndSaveSeasonData(body.configId);
      return result;
    },
    {
      auth: true,
      admin: true,
      body: SeasonModel.fetchSeasonDataBody,
      detail: {
        summary: "Buscar e salvar dados da temporada (teste)",
        description:
          "Busca os dados de previousSeason de todos os jogadores dos clans cadastrados e salva no banco. Apenas administradores podem acessar esta rota.",
        tags: ["Seasons"],
      },
      response: {
        200: SeasonModel.fetchSeasonDataResponse,
        403: SeasonModel.errorResponse,
      },
    },
  );

