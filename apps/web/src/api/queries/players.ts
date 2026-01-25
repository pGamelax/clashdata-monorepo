/**
 * Queries e funções de requisição para Players
 */

import { queryOptions } from "@tanstack/react-query";
import { apiFetch, normalizeTag } from "../client";
import { endpoints } from "../endpoints";
import type { PlayerInfo, WarHistory } from "../types";

/**
 * Query options para obter informações de um jogador
 */
export const getPlayerInfoQueryOptions = (playerTag: string) =>
  queryOptions({
    queryKey: ["player-info", playerTag],
    queryFn: async () => {
      const cleanTag = normalizeTag(playerTag);
      const response = await apiFetch(endpoints.players.getInfo(cleanTag));
      return response as PlayerInfo;
    },
  });

/**
 * Query options para obter histórico de guerra de um jogador
 */
export const getPlayerWarHistoryQueryOptions = (playerTag: string) =>
  queryOptions({
    queryKey: ["player-war-history", playerTag],
    queryFn: async () => {
      const cleanTag = normalizeTag(playerTag);
      const response = await apiFetch(endpoints.players.getWarHistory(cleanTag));
      return response as WarHistory;
    },
  });

/**
 * Query options para buscar jogador (usado na página de busca)
 */
export const searchPlayerQueryOptions = (playerTag: string) =>
  queryOptions({
    queryKey: ["search-player", playerTag],
    queryFn: async () => {
      if (!playerTag || playerTag.trim() === "") return null;
      const cleanTag = normalizeTag(playerTag);
      const response = await apiFetch(endpoints.players.getInfo(cleanTag));
      return response as PlayerInfo;
    },
  });

