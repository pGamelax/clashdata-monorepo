/**
 * Queries e funções de requisição para Wars
 */

import { queryOptions } from "@tanstack/react-query";
import { apiFetch, normalizeTag } from "../client";
import { endpoints } from "../endpoints";
import type { CurrentWar } from "@/routes/(private)/clan/-current-war-types";

/**
 * Query options para obter guerra atual
 */
export const getCurrentWarQueryOptions = (clanTag: string) =>
  queryOptions({
    queryKey: ["current-war", clanTag],
    queryFn: async () => {
      try {
        const cleanTag = normalizeTag(clanTag);
        const response = await apiFetch(endpoints.dashboard.getCurrentWar(cleanTag));
        
        // Se a resposta for null ou undefined, retorna null
        if (!response) {
          return null;
        }
        
        return response as CurrentWar | null;
      } catch (error) {
        // Se for erro 404, retorna null (não há guerra atual)
        if (error instanceof Error && error.message.includes("404")) {
          return null;
        }
        // Para outros erros, relança
        throw error;
      }
    },
    staleTime: 30000, // 30 segundos - guerra atual muda frequentemente
    refetchInterval: 60000, // Atualiza a cada minuto
    retry: 1, // Tenta apenas uma vez em caso de erro
  });

