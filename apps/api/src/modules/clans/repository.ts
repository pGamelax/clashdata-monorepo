import { BadRequest } from "@/errors/Errors";
import { prisma } from "@/lib/prisma";

export class ClanRepository {
  /**
   * Cria um novo clan (se não existir) e associa ao usuário
   */
  async create({
    clanTag,
    name,
    userId,
  }: {
    clanTag: string;
    name: string;
    userId: string;
  }) {
    // Verifica se o clan já existe
    let clan = await prisma.clan.findUnique({
      where: {
        tag: clanTag,
      },
    });

    // Se não existir, cria o clan
    if (!clan) {
      clan = await prisma.clan.create({
        data: {
          name,
          tag: clanTag,
        },
      });
    }

    // Verifica se o usuário já tem acesso a este clan
    const existingUserClan = await prisma.userClan.findFirst({
      where: {
        userId,
        clanId: clan.id,
      },
    });

    if (existingUserClan) {
      throw new BadRequest("Este clan já está cadastrado para este usuário");
    }

    // Cria a associação entre usuário e clan
    await prisma.userClan.create({
      data: {
        userId,
        clanId: clan.id,
      },
    });

    return clan;
  }

  /**
   * Busca um clan pela tag
   */
  async findByTag({ clanTag }: { clanTag: string }) {
    const clan = await prisma.clan.findUnique({
      where: {
        tag: clanTag,
      },
    });

    if (!clan) {
      throw new BadRequest("Clan not found");
    }

    return clan;
  }

  /**
   * Busca todos os clans de um usuário
   */
  async findAllByUser({ userId }: { userId: string }) {
    const userClans = await prisma.userClan.findMany({
      where: {
        userId,
      },
      include: {
        clan: true,
      },
    });

    return userClans.map((uc) => uc.clan);
  }

  /**
   * Verifica se um usuário tem acesso a um clan específico
   */
  async findByUserAndTag({
    userId,
    clanTag,
  }: {
    userId: string;
    clanTag: string;
  }) {
    const userClan = await prisma.userClan.findFirst({
      where: {
        userId,
        clan: {
          tag: clanTag,
        },
      },
      include: {
        clan: true,
      },
    });

    return userClan?.clan || null;
  }

  /**
   * Remove a associação entre usuário e clan
   */
  async removeUserFromClan({
    userId,
    clanTag,
  }: {
    userId: string;
    clanTag: string;
  }) {
    const clan = await this.findByTag({ clanTag });

    const userClan = await prisma.userClan.findFirst({
      where: {
        userId,
        clanId: clan.id,
      },
    });

    if (!userClan) {
      throw new BadRequest("Usuário não tem acesso a este clan");
    }

    await prisma.userClan.delete({
      where: {
        id: userClan.id,
      },
    });

    return { success: true };
  }
}
