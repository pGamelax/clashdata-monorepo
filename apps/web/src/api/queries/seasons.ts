/**
 * Queries e funções de requisição para Seasons
 */

import { queryOptions } from "@tanstack/react-query";
import { apiFetch, normalizeTag } from "../client";
import { endpoints } from "../endpoints";

export interface SeasonConfig {
  id: string;
  scheduledAt: string;
  isProcessed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerSeasonData {
  id: string;
  playerTag: string;
  playerName: string;
  clanTag: string;
  seasonId: string;
  rank: number | null;
  trophies: number;
  configId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeasonByClan {
  seasonId: string;
  scheduledAt: string;
  playerCount: number;
}

export interface LogsBySeason {
  seasonId: string;
  scheduledAt: string;
  players: PlayerSeasonData[];
}

/**
 * Função para agendar worker de temporada
 */
export async function setSeasonEndDate(scheduledAt: string) {
  const response = await apiFetch(endpoints.seasons.setSeasonEndDate, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scheduledAt }),
  });
  return response as SeasonConfig;
}

/**
 * Query options para obter seasons de um clan
 */
export const getSeasonsByClanQueryOptions = (clanTag: string) =>
  queryOptions({
    queryKey: ["seasons", "by-clan", clanTag],
    queryFn: async () => {
      const cleanTag = normalizeTag(clanTag);
      const response = await apiFetch(endpoints.seasons.getSeasonsByClan(cleanTag));
      return response as SeasonByClan[];
    },
  });

/**
 * Query options para obter logs de uma season específica
 */
export const getLogsBySeasonQueryOptions = (seasonId: string, clanTag: string) =>
  queryOptions({
    queryKey: ["seasons", "logs", seasonId, clanTag],
    queryFn: async () => {
      const cleanTag = normalizeTag(clanTag);
      const response = await apiFetch(endpoints.seasons.getLogsBySeason(seasonId, cleanTag));
      return response as LogsBySeason;
    },
  });

/**
 * Query options para obter todas as configurações de temporada (admin)
 */
export const getAllConfigsQueryOptions = queryOptions({
  queryKey: ["seasons", "all-configs"],
  queryFn: async () => {
    const response = await apiFetch(endpoints.seasons.getAllConfigs);
    return response as SeasonConfig[];
  },
});

/**
 * Query options para obter todas as configurações de temporada (público, para filtragem)
 */
export const getConfigsQueryOptions = queryOptions({
  queryKey: ["seasons", "configs"],
  queryFn: async () => {
    const response = await apiFetch(endpoints.seasons.getConfigs);
    return response as SeasonConfig[];
  },
});

/**
 * Função para buscar e salvar dados da temporada (teste)
 */
export async function fetchSeasonData(configId: string) {
  const response = await apiFetch(endpoints.seasons.fetchSeasonData, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ configId }),
  });
  return response as {
    success: boolean;
    totalPlayersSaved: number;
    playersReset: number;
    message?: string;
  };
}

