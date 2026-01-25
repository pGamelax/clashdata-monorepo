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
export const getDashboardDataQuickQueryOptions = (clanTag: string) =>
  queryOptions({
    queryKey: ["dashboard-data-quick", clanTag],
    queryFn: async () => {
      const cleanTag = normalizeTag(clanTag);
      // Busca 100 guerras para ter dados dos últimos 4 meses rapidamente
      const response = await apiFetch(endpoints.dashboard.getData(cleanTag, 100));
      return response as DashboardData;
    },
    staleTime: 0, // Sempre busca dados frescos
  });

/**
 * Query options para obter dados completos do dashboard de guerra
 */
export const getDashboardDataQueryOptions = (clanTag: string) =>
  queryOptions({
    queryKey: ["dashboard-data", clanTag],
    queryFn: async () => {
      const cleanTag = normalizeTag(clanTag);
      const response = await apiFetch(endpoints.dashboard.getData(cleanTag));
      return response as DashboardData;
    },
    staleTime: 0, // Sempre busca dados frescos
  });

