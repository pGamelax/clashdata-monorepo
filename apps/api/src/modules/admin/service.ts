import axios from "axios";
import { BadRequest, NotFound } from "@/errors/Errors";
import { AdminRepository } from "./repository";
import { AdminModel } from "./model";
import { env } from "@/env";
import { prisma } from "@/lib/prisma";

export abstract class AdminService {
  abstract getAllClans(): Promise<AdminModel.ClansListResponse>;
  abstract getAllUsers(): Promise<AdminModel.UsersListResponse>;
  abstract createClan(
    clanTag: string,
    clanName?: string,
  ): Promise<AdminModel.CreateClanResponse>;
  abstract addClanToUser(
    userEmail: string,
    clanTag: string,
  ): Promise<AdminModel.AddClanToUserResponse>;
  abstract revokeClanAccess(
    userId: string,
    clanTag: string,
  ): Promise<AdminModel.RevokeClanAccessResponse>;
  abstract deleteClan(clanTag: string): Promise<AdminModel.DeleteClanResponse>;
  abstract searchClanFromAPI(clanTag: string): Promise<AdminModel.SearchClanResponse>;
}

export class AdminServiceImpl extends AdminService {
  private repository: AdminRepository;

  constructor() {
    super();
    this.repository = new AdminRepository();
  }

  async getAllClans(): Promise<AdminModel.ClansListResponse> {
    const clans = await this.repository.findAllClans();

    return clans.map((clan) => ({
      name: clan.name,
      tag: clan.tag,
      userCount: clan.userCount,
    }));
  }

  async getAllUsers(): Promise<AdminModel.UsersListResponse> {
    const users = await this.repository.findAllUsers();

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clans: user.clans,
    }));
  }

  async createClan(
    clanTag: string,
    clanName?: string,
  ): Promise<AdminModel.CreateClanResponse> {
    // Normaliza a tag do clã (adiciona # se não tiver)
    const normalizedTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;

    // Verifica se o clã já existe
    const existingClan = await this.repository.findClanByTag(normalizedTag);
    if (existingClan) {
      throw new BadRequest("Clã já existe no sistema");
    }

    let clanNameToUse: string = clanName || "";

    // Se o nome não foi fornecido, busca na API da Supercell
    if (!clanNameToUse) {
      try {
        const response = await axios.get(
          `https://api.clashofclans.com/v1/clans/${encodeURIComponent(normalizedTag)}`,
          { headers: { Authorization: `Bearer ${env.TOKEN_COC}` } },
        );

        if (!response.data || !response.data.name) {
          throw new NotFound("Clã não encontrado na API da Supercell");
        }

        clanNameToUse = response.data.name;
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            throw new NotFound("Clã não encontrado na API da Supercell");
          }
          throw new BadRequest("Erro ao buscar clã na API da Supercell");
        }
        throw error;
      }
    }

    // Cria o clã no banco de dados
    try {
      const clan = await this.repository.createClan(normalizedTag, clanNameToUse);

      return {
        message: "Clã criado com sucesso",
        clan: {
          id: clan.id,
          name: clan.name,
          tag: clan.tag,
        },
      };
    } catch (error: any) {
      // Trata erro de constraint única (caso ocorra race condition)
      if (error.code === "P2002") {
        throw new BadRequest("Clã já existe no sistema");
      }
      throw error;
    }
  }

  async addClanToUser(
    userEmail: string,
    clanTag: string,
  ): Promise<AdminModel.AddClanToUserResponse> {
    // Normaliza a tag do clã (adiciona # se não tiver)
    const normalizedTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;

    // Verifica se o usuário existe
    const user = await this.repository.findUserByEmail(userEmail);
    if (!user) {
      throw new NotFound("Usuário não encontrado");
    }

    // Verifica se o clã existe no banco de dados
    let clan = await this.repository.findClanByTag(normalizedTag);

    // Se o clã não existir, busca na API da Supercell e cria
    if (!clan) {
      try {
        const response = await axios.get(
          `https://api.clashofclans.com/v1/clans/${encodeURIComponent(normalizedTag)}`,
          { headers: { Authorization: `Bearer ${env.TOKEN_COC}` } },
        );

        if (!response.data) {
          throw new NotFound("Clã não encontrado na API da Supercell");
        }

        // Cria o clã no banco de dados
        clan = await prisma.clan.create({
          data: {
            name: response.data.name,
            tag: normalizedTag,
          },
        });
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            throw new NotFound("Clã não encontrado na API da Supercell");
          }
          throw new BadRequest("Erro ao buscar clã na API da Supercell");
        }
        throw error;
      }
    }

    // Verifica se o usuário já tem acesso a este clã
    const hasAccess = await this.repository.userHasClanAccess(user.id, clan.id);
    if (hasAccess) {
      throw new BadRequest("Usuário já tem acesso a este clã");
    }

    // Adiciona o acesso
    try {
      await this.repository.addClanToUser(user.id, clan.id);

      return {
        message: "Clã adicionado ao usuário com sucesso",
        clan: {
          id: clan.id,
          name: clan.name,
          tag: clan.tag,
        },
      };
    } catch (error: any) {
      // Trata erro de constraint única (caso ocorra race condition)
      if (error.code === "P2002") {
        throw new BadRequest("Usuário já tem acesso a este clã");
      }
      throw error;
    }
  }

  async revokeClanAccess(
    userId: string,
    clanTag: string,
  ): Promise<AdminModel.RevokeClanAccessResponse> {
    // Normaliza a tag do clã (adiciona # se não tiver)
    const normalizedTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;

    // Verifica se o usuário existe
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new NotFound("Usuário não encontrado");
    }

    // Verifica se o clã existe
    const clan = await this.repository.findClanByTag(normalizedTag);
    if (!clan) {
      throw new NotFound("Clã não encontrado");
    }

    // Remove o acesso
    const result = await this.repository.removeClanFromUser(user.id, clan.id);
    if (!result) {
      throw new BadRequest("Usuário não tem acesso a este clã");
    }

    return {
      message: "Acesso ao clã revogado com sucesso",
    };
  }

  async deleteClan(clanTag: string): Promise<AdminModel.DeleteClanResponse> {
    // Normaliza a tag do clã (adiciona # se não tiver)
    const normalizedTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;

    // Verifica se o clã existe
    const clan = await this.repository.findClanByTag(normalizedTag);
    if (!clan) {
      throw new NotFound("Clã não encontrado");
    }

    // Deleta o clã
    const result = await this.repository.deleteClan(normalizedTag);
    if (!result) {
      throw new BadRequest("Erro ao deletar clã");
    }

    return {
      message: "Clã deletado com sucesso",
    };
  }

  async searchClanFromAPI(clanTag: string): Promise<AdminModel.SearchClanResponse> {
    // Normaliza a tag do clã (adiciona # se não tiver)
    const normalizedTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;

    try {
      const response = await axios.get(
        `https://api.clashofclans.com/v1/clans/${encodeURIComponent(normalizedTag)}`,
        { headers: { Authorization: `Bearer ${env.TOKEN_COC}` } },
      );

      if (!response.data) {
        throw new NotFound("Clã não encontrado na API da Supercell");
      }

      return {
        tag: response.data.tag,
        name: response.data.name,
        description: response.data.description,
        members: response.data.members,
        clanLevel: response.data.clanLevel,
        badgeUrls: response.data.badgeUrls,
      };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new NotFound("Clã não encontrado na API da Supercell");
        }
        throw new BadRequest("Erro ao buscar clã na API da Supercell");
      }
      throw error;
    }
  }
}

