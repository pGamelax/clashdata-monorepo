/**
 * Queries e funções de requisição para Dashboard
 */

import { queryOptions } from "@tanstack/react-query";
import { apiFetch, normalizeTag } from "../client";
import { endpoints } from "../endpoints";
import type { DashboardData } from "../types";

/**
 * Query options para obter dados do dashboard de guerra (carregamento rápido inicial)
 */
export const getDashboardDataQuickQueryOptions = (clanTag: string, limit?: number, offset?: number) =>
  queryOptions({
    queryKey: ["dashboard-data-quick", clanTag, limit, offset],
    queryFn: async () => {
      const cleanTag = normalizeTag(clanTag);
      // Busca apenas o necessário (padrão 10 para carregamento rápido)
      const response = await apiFetch(endpoints.dashboard.getData(cleanTag, limit || 10, offset));
      return response as DashboardData;
    },
    staleTime: 0, // Sempre busca dados frescos
  });

/**
 * Query options para obter dados completos do dashboard de guerra
 */
export const getDashboardDataQueryOptions = (clanTag: string, limit?: number, offset?: number) =>
  queryOptions({
    queryKey: ["dashboard-data", clanTag, limit, offset],
    queryFn: async () => {
      const cleanTag = normalizeTag(clanTag);
      const response = await apiFetch(endpoints.dashboard.getData(cleanTag, limit, offset));
      return response as DashboardData;
    },
    staleTime: 0, // Sempre busca dados frescos
  });

/**
 * Query options para obter histórico de guerras do clã
 */
export const getWarHistoryQueryOptions = (clanTag: string, limit?: number, offset?: number) =>
  queryOptions({
    queryKey: ["war-history", clanTag, limit, offset],
    queryFn: async () => {
      const cleanTag = normalizeTag(clanTag);
      const response = await apiFetch(endpoints.dashboard.getWarHistory(cleanTag, limit, offset));
      return response as { items: any[]; total?: number; hasMore?: boolean };
    },
  });

/**
 * Query options para obter dados de CWL de uma season específica
 */
export const getCWLSeasonQueryOptions = (clanTag: string, season: string) =>
  queryOptions({
    queryKey: ["cwl-season", clanTag, season],
    queryFn: async () => {
      const cleanTag = normalizeTag(clanTag);
      const response = await apiFetch(endpoints.dashboard.getCWLSeason(cleanTag, season));
      return response as any;
    },
  });

/**
 * Query options para obter dados de CWL da última season
 */
export const getCWLLatestSeasonQueryOptions = (clanTag: string) =>
  queryOptions({
    queryKey: ["cwl-latest-season", clanTag],
    queryFn: async () => {
      const cleanTag = normalizeTag(clanTag);
      const response = await apiFetch(endpoints.dashboard.getCWLLatestSeason(cleanTag));
      return response as any;
    },
  });

/**
 * Query options para obter dados de guerras normais
 */
export const getNormalWarsQueryOptions = (clanTag: string, months?: string[]) =>
  queryOptions({
    queryKey: ["normal-wars", clanTag, months],
    queryFn: async () => {
      const cleanTag = normalizeTag(clanTag);
      const response = await apiFetch(endpoints.dashboard.getNormalWars(cleanTag, months));
      return response as { players: any[]; totalNormalWars: number };
    },
    staleTime: 0,
  });

