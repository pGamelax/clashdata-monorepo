import { z } from "zod";

export namespace AdminModel {
  // Schema para resposta de clã
  export const clanResponse = z.object({
    name: z.string(),
    tag: z.string(),
    userCount: z.number().optional(),
    plan: z.object({
      isActive: z.boolean(),
      activatedAt: z.string().nullable(),
      activatedBy: z.string().nullable(),
    }).nullable().optional(),
  });

  export type ClanResponse = z.infer<typeof clanResponse>;

  // Schema para resposta de usuário
  export const userClan = z.object({
    tag: z.string(),
    name: z.string(),
  });

  export type UserClan = z.infer<typeof userClan>;

  export const userResponse = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(["admin", "user", "moderator"]),
    clans: z.array(userClan),
  });

  export type UserResponse = z.infer<typeof userResponse>;

  // Schema para adicionar clã a usuário
  export const addClanToUserBody = z.object({
    userEmail: z.string().email("Email inválido"),
    clanTag: z.string().min(1, "Tag do clã é obrigatória"),
  });

  export type AddClanToUserBody = z.infer<typeof addClanToUserBody>;

  export const addClanToUserResponse = z.object({
    message: z.string(),
    clan: z.object({
      id: z.string(),
      name: z.string(),
      tag: z.string(),
    }),
  });

  export type AddClanToUserResponse = z.infer<typeof addClanToUserResponse>;

  // Schema para revogar acesso
  export const revokeClanAccessBody = z.object({
    userId: z.string().uuid("ID do usuário inválido"),
    clanTag: z.string().min(1, "Tag do clã é obrigatória"),
  });

  export type RevokeClanAccessBody = z.infer<typeof revokeClanAccessBody>;

  export const revokeClanAccessResponse = z.object({
    message: z.string(),
  });

  export type RevokeClanAccessResponse = z.infer<typeof revokeClanAccessResponse>;

  // Respostas de erro padronizadas
  export const errorResponse = z.object({
    message: z.string(),
  });

  export type ErrorResponse = z.infer<typeof errorResponse>;

  // Resposta de lista de clãs
  export const clansListResponse = z.array(clanResponse);
  export type ClansListResponse = z.infer<typeof clansListResponse>;

  // Resposta de lista de usuários
  export const usersListResponse = z.array(userResponse);
  export type UsersListResponse = z.infer<typeof usersListResponse>;

  // Schema para criar clã
  export const createClanBody = z.object({
    clanTag: z.string().min(1, "Tag do clã é obrigatória"),
  });

  export type CreateClanBody = z.infer<typeof createClanBody>;

  export const createClanResponse = z.object({
    message: z.string(),
    clan: z.object({
      id: z.string(),
      name: z.string(),
      tag: z.string(),
    }),
  });

  export type CreateClanResponse = z.infer<typeof createClanResponse>;

  // Schema para deletar clã
  export const deleteClanBody = z.object({
    clanTag: z.string().min(1, "Tag do clã é obrigatória"),
  });

  export type DeleteClanBody = z.infer<typeof deleteClanBody>;

  export const deleteClanResponse = z.object({
    message: z.string(),
  });

  export type DeleteClanResponse = z.infer<typeof deleteClanResponse>;

  // Schema para buscar clã na API
  export const searchClanQuery = z.object({
    clanTag: z.string().min(1, "Tag do clã é obrigatória"),
  });

  export type SearchClanQuery = z.infer<typeof searchClanQuery>;

  export const searchClanResponse = z.object({
    tag: z.string(),
    name: z.string(),
    description: z.string().optional(),
    members: z.number().optional(),
    clanLevel: z.number().optional(),
    badgeUrls: z.object({
      small: z.string().optional(),
      medium: z.string().optional(),
      large: z.string().optional(),
    }).optional(),
  });

  export type SearchClanResponse = z.infer<typeof searchClanResponse>;

  // Schema para ativar/desativar plano
  export const toggleClanPlanBody = z.object({
    clanTag: z.string().min(1, "Tag do clã é obrigatória"),
    isActive: z.boolean(),
  });

  export type ToggleClanPlanBody = z.infer<typeof toggleClanPlanBody>;

  export const toggleClanPlanResponse = z.object({
    message: z.string(),
    plan: z.object({
      id: z.string(),
      clanId: z.string(),
      isActive: z.boolean(),
      activatedAt: z.string().nullable(),
      activatedBy: z.string().nullable(),
    }),
  });

  export type ToggleClanPlanResponse = z.infer<typeof toggleClanPlanResponse>;

  // Schema para obter plano do clã
  export const getClanPlanQuery = z.object({
    clanTag: z.string().min(1, "Tag do clã é obrigatória"),
  });

  export type GetClanPlanQuery = z.infer<typeof getClanPlanQuery>;

  export const clanPlanResponse = z.object({
    id: z.string(),
    clanId: z.string(),
    isActive: z.boolean(),
    activatedAt: z.string().nullable(),
    activatedBy: z.string().nullable(),
  });

  export type ClanPlanResponse = z.infer<typeof clanPlanResponse>;
}

