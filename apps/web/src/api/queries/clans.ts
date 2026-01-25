/**
 * Queries e funções de requisição para Clans
 */

import { queryOptions } from "@tanstack/react-query";
import { apiFetch, normalizeTag } from "../client";
import { endpoints } from "../endpoints";
import type { Clan, ClanInfo, CreateClanBody, CreateClanResponse } from "../types";

/**
 * Query options para obter todos os clans do usuário
 */
export const getClansQueryOptions = queryOptions({
  queryKey: ["my-clans"],
  queryFn: async () => {
    const response = await apiFetch(endpoints.clans.getClans);
    return response as Clan[];
  },
});

/**
 * Query options para obter informações de um clan
 */
export const getClanInfoQueryOptions = (clanTag: string) =>
  queryOptions({
    queryKey: ["clan-info", clanTag],
    queryFn: async () => {
      const cleanTag = normalizeTag(clanTag);
      const response = await apiFetch(endpoints.clans.getClanInfo(cleanTag));
      return response as ClanInfo;
    },
  });

/**
 * Função para criar um clan (admin only)
 */
export const createClan = async (body: CreateClanBody): Promise<CreateClanResponse> => {
  const cleanTag = normalizeTag(body.clanTag);
  const response = await apiFetch(endpoints.clans.create, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...body,
      clanTag: cleanTag,
    }),
  });
  return response as CreateClanResponse;
};

