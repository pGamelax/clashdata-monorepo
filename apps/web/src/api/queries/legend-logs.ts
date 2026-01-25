/**
 * Queries e funções de requisição para Legend Logs
 */

import { queryOptions } from "@tanstack/react-query";
import { apiFetch, normalizeTag } from "../client";
import { endpoints } from "../endpoints";
import type { PlayerLogsResponse, ClanLogsResponse, ClanRankingResponse } from "../types";

/**
 * Query options para obter logs de Legend League de um jogador
 */
export const getPlayerLogsQueryOptions = (playerTag: string) =>
  queryOptions({
    queryKey: ["player-push-logs", playerTag],
    queryFn: async () => {
      const cleanTag = normalizeTag(playerTag);
      const response = await apiFetch(endpoints.legendLogs.getPlayerLogs(cleanTag));
      return response as PlayerLogsResponse;
    },
  });

/**
 * Query options para obter logs de Legend League de um clan
 */
export const getClanLogsQueryOptions = (clanTag: string) =>
  queryOptions({
    queryKey: ["push", clanTag],
    queryFn: async () => {
      const cleanTag = normalizeTag(clanTag);
      const response = await apiFetch(endpoints.legendLogs.getClanLogs(cleanTag));
      return response as ClanLogsResponse;
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos (aumentado para evitar refetch)
    gcTime: 10 * 60 * 1000, // Manter em cache por 10 minutos
    refetchOnWindowFocus: false, // Não refetch ao focar na janela
    refetchOnMount: false, // Não refetch ao montar se já tiver dados
    retry: 1, // Apenas 1 tentativa em caso de erro
  });

/**
 * Query options para obter ranking atual dos jogadores do clan
 */
export const getClanRankingQueryOptions = (clanTag: string) =>
  queryOptions({
    queryKey: ["clan-ranking", clanTag],
    queryFn: async () => {
      const cleanTag = normalizeTag(clanTag);
      const response = await apiFetch(endpoints.legendLogs.getClanRanking(cleanTag));
      return response as ClanRankingResponse;
    },
    staleTime: 0, // Sempre considerar stale para dados em tempo real
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    refetchOnWindowFocus: true, // Atualizar quando o usuário volta à aba
  });

