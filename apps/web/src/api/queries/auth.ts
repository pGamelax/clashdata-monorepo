/**
 * Queries e funções de requisição para Autenticação
 */

import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "../client";
import { endpoints } from "../endpoints";
import type { Session } from "../types";

/**
 * Query options para obter a sessão do usuário
 */
export const getSessionQueryOptions = queryOptions({
  queryKey: ["session"],
  queryFn: async () => {
    const response = await apiFetch(endpoints.auth.getSession);
    return response as Session;
  },
});

