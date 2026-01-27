import { adminPlugin } from "@/http/plugins/admin-auth";
import { betterAuthPlugin } from "@/http/plugins/better-auth";
import { Elysia } from "elysia";
import { ClanModel } from "@/modules/clans/model";
import { ClanServiceImpl } from "./service";
import { verifyClanOwnership } from "@/utils/verify-clan-ownership";

// Helper para normalizar tags (adiciona # se não tiver)
function normalizeTag(tag: string): string {
  return tag.startsWith("#") ? tag : `#${tag}`;
}

export const clans = new Elysia({ prefix: "/clans" })
  .use(betterAuthPlugin)
  .use(adminPlugin)
  .post(
    "/create",
    async ({ body }) => {
      const clanService = new ClanServiceImpl();

      const normalizedTag = normalizeTag(body.clanTag);

      const clanCreated = await clanService.createClan({
        clanTag: normalizedTag,
        userEmail: body.userEmail,
      });

      return clanCreated;
    },
    {
      auth: true,
      admin: true,
      detail: {
        summary: "Criar clan",
        description:
          "Cadastra um novo clan para um usuário. Apenas administradores podem criar clans. " +
          "O clanTag será normalizado automaticamente (adiciona # se não tiver).",
        tags: ["Clan"],
        examples: [
          {
            summary: "Exemplo de requisição",
            description: "Criar um clan para um usuário",
            value: {
              clanTag: "#CLAN123",
              userEmail: "user@example.com",
            },
          },
        ],
      },
      body: ClanModel.createBody,
      response: {
        200: ClanModel.createResponse,
        400: ClanModel.createInvalid,
      },
    },
  )
  .get(
    "/get-clans",
    async ({ user }) => {
      const clanService = new ClanServiceImpl();

      const clans = await clanService.getAllClans({ userId: user.id });

      return clans;
    },
    {
      auth: true,
      detail: {
        summary: "Obter todos os clans do usuário",
        description:
          "Retorna uma lista com todos os clans cadastrados pelo usuário autenticado. " +
          "Cada clan inclui informações básicas como nome, tag e datas de criação/atualização.",
        tags: ["Clan"],
        examples: [
          {
            summary: "Exemplo de resposta",
            description: "Lista de clans do usuário",
            value: {
              clans: [
                {
                  id: "uuid-123",
                  name: "Clan Name",
                  tag: "#CLAN123",
                  userId: "user-uuid",
                  createdAt: "2024-01-15T10:00:00Z",
                  updatedAt: "2024-01-15T10:00:00Z",
                },
              ],
            },
          },
        ],
      },
      response: {
        200: ClanModel.getAllClansResponse,
        401: ClanModel.errorResponse,
      },
    },
  )
  .get(
    "/clan-info",
    async ({ query, user }) => {
      const { clanTag } = query;
      const normalizedTag = normalizeTag(clanTag);
    
      // Verifica se o clan pertence ao usuário logado
      await verifyClanOwnership(normalizedTag, user.id);

      const clanService = new ClanServiceImpl();
      const clanInfo = await clanService.getClanInfo({
        clanTag: normalizedTag,
      });

      return clanInfo;
    },
    {
      auth: true,
      detail: {
        summary: "Obter informações de um clan",
        description:
          "Busca informações detalhadas de um clan na API da Supercell. " +
          "Inclui estatísticas de guerra, emblema e descrição. " +
          "O clanTag será normalizado automaticamente (adiciona # se não tiver).",
        tags: ["Clan"],
        examples: [
          {
            summary: "Exemplo de requisição",
            description: "Buscar informações de um clan",
            value: {
              clanTag: "#CLAN123",
            },
          },
          {
            summary: "Exemplo de resposta",
            description: "Informações detalhadas do clan",
            value: {
              name: "Clan Name",
              tag: "#CLAN123",
              description: "Clan description",
              badgeUrls: {
                small: "https://...",
                medium: "https://...",
                large: "https://...",
              },
              totalWars: 100,
              warWins: 80,
              warTies: 5,
              warLosses: 15,
            },
          },
        ],
      },
      query: ClanModel.getClanInfoQuery,
      response: {
        200: ClanModel.clanInfoResponse,
        400: ClanModel.errorResponse,
        403: ClanModel.errorResponse,
        404: ClanModel.errorResponse,
      },
    },
  );
