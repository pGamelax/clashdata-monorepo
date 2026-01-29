/**
 * Queries e funções de requisição para Admin
 */

import { queryOptions } from "@tanstack/react-query";
import { apiFetch, normalizeTag } from "../client";
import { endpoints } from "../endpoints";
import type {
  AdminClan,
  AdminUser,
  CreateClanAdminBody,
  CreateClanAdminResponse,
  AddClanToUserBody,
  AddClanToUserResponse,
  RevokeClanAccessBody,
  RevokeClanAccessResponse,
} from "../types";

/**
 * Query options para obter todos os clans (admin only)
 */
export const getAllClansQueryOptions = queryOptions({
  queryKey: ["admin-all-clans"],
  queryFn: async () => {
    const response = await apiFetch(endpoints.admin.getAllClans);
    return response as AdminClan[];
  },
});

/**
 * Query options para obter todos os usuários (admin only)
 */
export const getAllUsersQueryOptions = queryOptions({
  queryKey: ["admin-all-users"],
  queryFn: async () => {
    const response = await apiFetch(endpoints.admin.getAllUsers);
    return response as AdminUser[];
  },
});

/**
 * Função para criar um clan (admin only)
 */
export const createClanAdmin = async (
  body: CreateClanAdminBody,
): Promise<CreateClanAdminResponse> => {
  const cleanTag = normalizeTag(body.clanTag);
  const response = await apiFetch(endpoints.admin.createClan, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clanTag: cleanTag,
    }),
  });
  return response as CreateClanAdminResponse;
};

/**
 * Função para atribuir um clan a um usuário (admin only)
 */
export const addClanToUser = async (
  body: AddClanToUserBody,
): Promise<AddClanToUserResponse> => {
  const cleanTag = normalizeTag(body.clanTag);
  const response = await apiFetch(endpoints.admin.addClanToUser, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...body,
      clanTag: cleanTag,
    }),
  });
  return response as AddClanToUserResponse;
};

/**
 * Função para revogar acesso de um usuário a um clan (admin only)
 */
export const revokeClanAccess = async (
  body: RevokeClanAccessBody,
): Promise<RevokeClanAccessResponse> => {
  const cleanTag = normalizeTag(body.clanTag);
  const response = await apiFetch(endpoints.admin.revokeClanAccess, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...body,
      clanTag: cleanTag,
    }),
  });
  return response as RevokeClanAccessResponse;
};

/**
 * Função para ativar/desativar plano de um clã (admin only)
 */
export const toggleClanPlan = async (
  clanTag: string,
  isActive: boolean,
): Promise<{ message: string; plan: { id: string; clanId: string; isActive: boolean; activatedAt: string | null; activatedBy: string | null } }> => {
  const cleanTag = normalizeTag(clanTag);
  const response = await apiFetch(endpoints.admin.toggleClanPlan, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clanTag: cleanTag,
      isActive,
    }),
  });
  return response as { message: string; plan: { id: string; clanId: string; isActive: boolean; activatedAt: string | null; activatedBy: string | null } };
};

/**
 * Query options para obter plano de um clã (admin only)
 */
export const getClanPlanQueryOptions = (clanTag: string) =>
  queryOptions({
    queryKey: ["admin-clan-plan", clanTag],
    queryFn: async () => {
      const cleanTag = normalizeTag(clanTag);
      const response = await apiFetch(endpoints.admin.getClanPlan(cleanTag));
      return response as { id: string; clanId: string; isActive: boolean; activatedAt: string | null; activatedBy: string | null } | null;
    },
  });

