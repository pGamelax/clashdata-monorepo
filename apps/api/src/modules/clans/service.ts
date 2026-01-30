import axios from "axios";
import { UserRepository } from "../users/repository";
import { ClanModel } from "./model";
import { ClanRepository } from "./repository";
import { env } from "@/env";
import { BadRequest } from "@/errors/Errors";
import { prisma } from "@/lib/prisma";

export abstract class ClanService {
  abstract createClan({
    clanTag,
    userEmail,
  }: {
    clanTag: string;
    userEmail: string;
  }): Promise<ClanModel.Clan>;

  abstract startQueue({
    clanTag,
  }: {
    clanTag: string;
  }): Promise<{ message: string }>;

  abstract getClanInfo({
    clanTag,
  }: {
    clanTag: string;
  }): Promise<ClanModel.ClanInfoResponse>;

  abstract getAllClans({
    userId,
  }: {
    userId: string;
  }): Promise<ClanModel.Clan[]>;
}

export class ClanServiceImpl extends ClanService {
  async createClan({
    clanTag,
    userEmail,
  }: {
    clanTag: string;
    userEmail: string;
  }): Promise<ClanModel.Clan> {
    const clanRepository = new ClanRepository();
    const userRepository = new UserRepository();

    const response = await axios.get(
      `https://api.clashofclans.com/v1/clans/${encodeURIComponent(clanTag)}`,
      { headers: { Authorization: `Bearer ${env.TOKEN_COC}` } },
    );

    if (!response.data) {
      throw new Error("Clan not found");
    }

    const user = await userRepository.findByEmail({ email: userEmail });

    if (!user) {
      throw new Error("User not found");
    }

    // Verifica se o usuário já tem este clan cadastrado
    const existingClan = await clanRepository.findByUserAndTag({
      userId: user.id,
      clanTag,
    });

    if (existingClan) {
      throw new BadRequest("Este clan já está cadastrado para este usuário");
    }

    try {
      const clanCreated = await clanRepository.create({
        clanTag,
        name: response.data.name,
        userId: user.id,
      });

      return {
        id: clanCreated.id,
        name: clanCreated.name,
        tag: clanCreated.tag,
        createdAt: clanCreated.createdAt.toISOString(),
        updatedAt: clanCreated.updatedAt.toISOString(),
      };
    } catch (error: any) {
      // Trata erro de constraint única (caso ocorra race condition)
      if (error.code === "P2002") {
        if (error.meta?.target?.includes("user_id") || error.meta?.target?.includes("clan_id")) {
          throw new BadRequest("Este clan já está cadastrado para este usuário");
        }
        if (error.meta?.target?.includes("tag")) {
          // Clan já existe, tenta associar o usuário
          const existingClan = await clanRepository.findByTag({ clanTag });
          if (existingClan) {
            // Tenta criar a associação novamente (pode ter sido criado entre as verificações)
            try {
              await prisma.userClan.create({
                data: {
                  userId: user.id,
                  clanId: existingClan.id,
                },
              });
              return {
                id: existingClan.id,
                name: existingClan.name,
                tag: existingClan.tag,
                createdAt: existingClan.createdAt.toISOString(),
                updatedAt: existingClan.updatedAt.toISOString(),
              };
            } catch (createError: any) {
              if (createError.code === "P2002") {
                throw new BadRequest("Este clan já está cadastrado para este usuário");
              }
              throw createError;
            }
          }
        }
      }
      throw error;
    }
  }

  async startQueue({
    clanTag,
  }: {
    clanTag: string;
  }): Promise<{ message: string }> {
    const clanRepository = new ClanRepository();

    const clan = await clanRepository.findByTag({ clanTag: clanTag });

    if (!clan) {
      throw new BadRequest("Clan not found");
    }

    return { message: `Queue started with successfully to clan ${clan.name}` };
  }

  async getClanInfo({
    clanTag,
  }: {
    clanTag: string;
  }): Promise<ClanModel.ClanInfoResponse> {
    const response = await axios.get(
      `https://api.clashofclans.com/v1/clans/${encodeURIComponent(clanTag)}`,
      { headers: { Authorization: `Bearer ${env.TOKEN_COC}` } },
    );
   
    if (!response.data) throw new BadRequest("Clan not found");
    
    // Garante que todos os valores numéricos sejam números válidos
    const warWins = response.data.warWins ?? 0;
    const warLosses = response.data.warLosses ?? 0;
    const warTies = response.data.warTies ?? 0;
    
    return {
      ...response.data,
      totalWars: warWins + warLosses + warTies,
      warWins,
      warLosses,
      warTies,
    };
  }

  async getAllClans({ userId }: { userId: string }): Promise<ClanModel.Clan[]> {
    const clanRepository = new ClanRepository();

    const clans = await clanRepository.findAllByUser({ userId });
    if (!clans) return [];

    return clans.map((clan) => ({
      ...clan,
      createdAt: clan.createdAt.toISOString(),
      updatedAt: clan.updatedAt.toISOString(),
    }));
  }
}
