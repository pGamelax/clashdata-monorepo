import { betterAuthPlugin } from "@/http/plugins/better-auth";
import { Elysia } from "elysia";
import { PushModel } from "./model";
import { PushService } from "./service";

const pushService = new PushService();

// Helper para normalizar tags (adiciona # se não tiver)
function normalizeTag(tag: string): string {
  return tag.startsWith("#") ? tag : `#${tag}`;
}

export const push = new Elysia({ prefix: "/push" })
  .use(betterAuthPlugin)
  .get(
    "/get-attacks",
    async ({ query, user }) => {
      const { clanTag } = query;
      const normalizedTag = normalizeTag(clanTag);

      const attacksByClan = await pushService.getLegendAttacksByClan({
        clanTag: normalizedTag,
        userId: user.id,
      });

      return attacksByClan;
    },
    {
      auth: true,
      detail: {
        summary: "Obter ataques da Legend League por clan",
        description:
          "Retorna os ataques da Legend League de todos os jogadores de um clan cadastrado. " +
          "Apenas o dono do clan pode acessar essas informações.",
        tags: ["Push"],
        examples: [
          {
            summary: "Exemplo de requisição",
            description: "Buscar ataques da Legend League de um clan",
            value: {
              clanTag: "#CLAN123",
            },
          },
        ],
      },
      query: PushModel.getAttacksQuery,
      response: {
        200: PushModel.getAttacksResponse,
        400: PushModel.errorResponse,
        401: PushModel.errorResponse,
        403: PushModel.errorResponse,
      },
    },
  );
