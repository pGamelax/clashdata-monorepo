import { env } from "@/env";
import { betterAuthPlugin } from "@/http/plugins/better-auth";
import { addPlayerToSnapshotAndQueue } from "@/utils/queue-player";
import axios from "axios";
import { Elysia } from "elysia";
import { PlayerModel } from "./model";

// Helper para normalizar tags (adiciona # se não tiver)
function normalizeTag(tag: string): string {
  return tag.startsWith("#") ? tag : `#${tag}`;
}

export const players = new Elysia({ prefix: "/players" })
  .use(betterAuthPlugin)
  .get(
    "/info",
    async ({ query, user }) => {
      const { playerTag } = query;
      const normalizedTag = normalizeTag(playerTag);

      const response = await axios.get(
        `https://api.clashofclans.com/v1/players/${encodeURIComponent(normalizedTag)}`,
        { headers: { Authorization: `Bearer ${env.TOKEN_COC}` } },
      );

      // Adiciona o jogador ao snapshot e à fila de monitoramento da Legend League
      // Faz isso de forma assíncrona para não bloquear a resposta
      addPlayerToSnapshotAndQueue(
        response.data.tag,
        response.data.name,
        response.data.clan?.tag
      ).catch((error) => {
        // Log silencioso - não queremos que erros na queue afetem a resposta da API
        console.debug(`Não foi possível adicionar ${response.data.tag} ao snapshot/queue:`, error.message);
      });

      return response.data;
    },
    {
      auth: true,
      detail: {
        summary: "Obter informações de um jogador",
        description:
          "Busca informações detalhadas de um jogador na API da Supercell. " +
          "Inclui estatísticas, clã, liga, conquistas e muito mais. " +
          "O jogador é automaticamente adicionado à fila de monitoramento da Legend League.",
        tags: ["Players"],
        examples: [
          {
            summary: "Exemplo de requisição",
            description: "Buscar informações de um jogador",
            value: {
              playerTag: "#ABC123",
            },
          },
        ],
      },
      query: PlayerModel.getPlayerInfoQuery,
      response: {
        200: PlayerModel.getPlayerInfoResponse,
        400: PlayerModel.errorResponse,
        404: PlayerModel.errorResponse,
      },
    },
  )
  .get(
    "/war-history",
    async ({ query, user }) => {
      const { playerTag } = query;
      const normalizedTag = normalizeTag(playerTag);

      const response = await axios.get(
        `https://api.clashk.ing/player/${encodeURIComponent(normalizedTag)}/warhits?timestamp_start=0&timestamp_end=2527625513&limit=20`,
      );

      // Adiciona o jogador ao snapshot e à fila de monitoramento
      // Faz isso de forma assíncrona para não bloquear a resposta
      addPlayerToSnapshotAndQueue(normalizedTag).catch((error) => {
        console.debug(`Não foi possível adicionar ${normalizedTag} ao snapshot/queue:`, error.message);
      });

      return response.data;
    },
    {
      auth: true,
      detail: {
        summary: "Obter histórico de guerra de um jogador",
        description:
          "Retorna o histórico de ataques e defesas de um jogador em guerras de clã. " +
          "Inclui informações sobre estrelas, porcentagem de destruição e duração dos ataques.",
        tags: ["Players"],
        examples: [
          {
            summary: "Exemplo de requisição",
            description: "Buscar histórico de guerra de um jogador",
            value: {
              playerTag: "#ABC123",
            },
          },
        ],
      },
      query: PlayerModel.getWarHistoryQuery,
      response: {
        200: PlayerModel.getWarHistoryResponse,
        400: PlayerModel.errorResponse,
        404: PlayerModel.errorResponse,
      },
    },
  );
