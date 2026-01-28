import { adminPlugin } from "@/http/plugins/admin-auth";
import { betterAuthPlugin } from "@/http/plugins/better-auth";
import { Elysia } from "elysia";
import { AdminModel } from "./model";
import { AdminServiceImpl } from "./service";

// Helper para normalizar tags (adiciona # se não tiver)
function normalizeTag(tag: string): string {
  return tag.startsWith("#") ? tag : `#${tag}`;
}

export const admin = new Elysia({ prefix: "/admin" })
  .use(betterAuthPlugin)
  .use(adminPlugin)
  .get(
    "/clans",
    async () => {
      const adminService = new AdminServiceImpl();
      const clans = await adminService.getAllClans();
      return clans;
    },
    {
      admin: true,
      detail: {
        summary: "Listar todos os clãs",
        description:
          "Retorna uma lista com todos os clãs cadastrados no sistema, incluindo a contagem de usuários associados a cada clã. Apenas administradores podem acessar esta rota.",
        tags: ["Admin"],
        examples: [
          {
            summary: "Exemplo de resposta",
            description: "Lista de clãs com contagem de usuários",
            value: [
              {
                name: "Clan Name",
                tag: "#CLAN123",
                userCount: 5,
              },
            ],
          },
        ],
      },
      response: {
        200: AdminModel.clansListResponse,
        403: AdminModel.errorResponse,
      },
    },
  )
  .get(
    "/users",
    async () => {
      const adminService = new AdminServiceImpl();
      const users = await adminService.getAllUsers();
      return users;
    },
    {
      admin: true,
      detail: {
        summary: "Listar todos os usuários",
        description:
          "Retorna uma lista com todos os usuários cadastrados no sistema, incluindo seus clãs associados. Apenas administradores podem acessar esta rota.",
        tags: ["Admin"],
        examples: [
          {
            summary: "Exemplo de resposta",
            description: "Lista de usuários com seus clãs",
            value: [
              {
                id: "uuid-123",
                name: "User Name",
                email: "user@example.com",
                role: "user",
                clans: [
                  {
                    tag: "#CLAN123",
                    name: "Clan Name",
                  },
                ],
              },
            ],
          },
        ],
      },
      response: {
        200: AdminModel.usersListResponse,
        403: AdminModel.errorResponse,
      },
    },
  )
  .post(
    "/create-clan",
    async ({ body }) => {
      const adminService = new AdminServiceImpl();
      const normalizedTag = normalizeTag(body.clanTag);

      const result = await adminService.createClan(
        normalizedTag,
      );
      return result;
    },
    {
      admin: true,
      detail: {
        summary: "Criar clã",
        description:
          "Cria um novo clã no sistema. Se o nome do clã não for fornecido, ele será buscado automaticamente na API da Supercell. Apenas administradores podem executar esta ação.",
        tags: ["Admin"],
        examples: [
          {
            summary: "Exemplo de requisição com nome",
            description: "Criar um clã fornecendo o nome",
            value: {
              clanTag: "#CLAN123",
              clanName: "Clan Name",
            },
          },
          {
            summary: "Exemplo de requisição sem nome",
            description: "Criar um clã sem fornecer o nome (será buscado na API)",
            value: {
              clanTag: "#CLAN123",
            },
          },
          {
            summary: "Exemplo de resposta",
            description: "Confirmação de sucesso",
            value: {
              message: "Clã criado com sucesso",
              clan: {
                id: "uuid-123",
                name: "Clan Name",
                tag: "#CLAN123",
              },
            },
          },
        ],
      },
      body: AdminModel.createClanBody,
      response: {
        200: AdminModel.createClanResponse,
        400: AdminModel.errorResponse,
        403: AdminModel.errorResponse,
        404: AdminModel.errorResponse,
      },
    },
  )
  .post(
    "/add-clan-to-user",
    async ({ body }) => {
      const adminService = new AdminServiceImpl();
      const normalizedTag = normalizeTag(body.clanTag);

      const result = await adminService.addClanToUser(
        body.userEmail,
        normalizedTag,
      );
      return result
    },
    {
      admin: true,
      detail: {
        summary: "Adicionar clã a usuário",
        description:
          "Adiciona um clã a um usuário. Se o clã não existir no banco de dados, ele será buscado na API da Supercell e criado automaticamente. Apenas administradores podem executar esta ação.",
        tags: ["Admin"],
        examples: [
          {
            summary: "Exemplo de requisição",
            description: "Adicionar um clã a um usuário",
            value: {
              userEmail: "user@example.com",
              clanTag: "#CLAN123",
            },
          },
          {
            summary: "Exemplo de resposta",
            description: "Confirmação de sucesso",
            value: {
              message: "Clã adicionado ao usuário com sucesso",
              clan: {
                id: "uuid-123",
                name: "Clan Name",
                tag: "#CLAN123",
              },
            },
          },
        ],
      },
      body: AdminModel.addClanToUserBody,
      response: {
        200: AdminModel.addClanToUserResponse,
        400: AdminModel.errorResponse,
        403: AdminModel.errorResponse,
        404: AdminModel.errorResponse,
      },
    },
  )
  .post(
    "/revoke-clan-access",
    async ({ body }) => {
      const adminService = new AdminServiceImpl();
      const normalizedTag = normalizeTag(body.clanTag);

      const result = await adminService.revokeClanAccess(
        body.userId,
        normalizedTag,
      );

      return result;
    },
    {
      admin: true,
      detail: {
        summary: "Revogar acesso de usuário a clã",
        description:
          "Remove o acesso de um usuário a um clã específico. Apenas administradores podem executar esta ação.",
        tags: ["Admin"],
        examples: [
          {
            summary: "Exemplo de requisição",
            description: "Revogar acesso de um usuário a um clã",
            value: {
              userId: "uuid-123",
              clanTag: "#CLAN123",
            },
          },
          {
            summary: "Exemplo de resposta",
            description: "Confirmação de sucesso",
            value: {
              message: "Acesso ao clã revogado com sucesso",
            },
          },
        ],
      },
      body: AdminModel.revokeClanAccessBody,
      response: {
        200: AdminModel.revokeClanAccessResponse,
        400: AdminModel.errorResponse,
        403: AdminModel.errorResponse,
        404: AdminModel.errorResponse,
      },
    },
  )
  .post(
    "/delete-clan",
    async ({ body }) => {
      const adminService = new AdminServiceImpl();
      const normalizedTag = normalizeTag(body.clanTag);

      const result = await adminService.deleteClan(normalizedTag);

      return result;
    },
    {
      admin: true,
      detail: {
        summary: "Deletar clã",
        description:
          "Remove um clã do sistema. Esta ação também remove todos os acessos de usuários a este clã. Apenas administradores podem executar esta ação.",
        tags: ["Admin"],
        examples: [
          {
            summary: "Exemplo de requisição",
            description: "Deletar um clã",
            value: {
              clanTag: "#CLAN123",
            },
          },
          {
            summary: "Exemplo de resposta",
            description: "Confirmação de sucesso",
            value: {
              message: "Clã deletado com sucesso",
            },
          },
        ],
      },
      body: AdminModel.deleteClanBody,
      response: {
        200: AdminModel.deleteClanResponse,
        400: AdminModel.errorResponse,
        403: AdminModel.errorResponse,
        404: AdminModel.errorResponse,
      },
    },
  )
  .get(
    "/search-clan",
    async ({ query }) => {
      const adminService = new AdminServiceImpl();
      const normalizedTag = normalizeTag(query.clanTag);

      const result = await adminService.searchClanFromAPI(normalizedTag);

      return result;
    },
    {
      admin: true,
      detail: {
        summary: "Buscar clã na API da Supercell",
        description:
          "Busca informações de um clã na API da Supercell. Apenas administradores podem executar esta ação.",
        tags: ["Admin"],
      },
      query: AdminModel.searchClanQuery,
      response: {
        200: AdminModel.searchClanResponse,
        400: AdminModel.errorResponse,
        403: AdminModel.errorResponse,
        404: AdminModel.errorResponse,
      },
    },
  );

