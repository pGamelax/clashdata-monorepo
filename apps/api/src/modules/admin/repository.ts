import { prisma } from "@/lib/prisma";

export class AdminRepository {
  /**
   * Busca todos os clãs com contagem de usuários
   */
  async findAllClans() {
    const clans = await prisma.clan.findMany({
      include: {
        userClans: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return clans.map((clan) => ({
      id: clan.id,
      name: clan.name,
      tag: clan.tag,
      userCount: clan.userClans.length,
      createdAt: clan.createdAt,
      updatedAt: clan.updatedAt,
    }));
  }

  /**
   * Busca todos os usuários com seus clãs
   */
  async findAllUsers() {
    const users = await prisma.user.findMany({
      include: {
        userClans: {
          include: {
            clan: {
              select: {
                id: true,
                name: true,
                tag: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clans: user.userClans.map((uc) => ({
        tag: uc.clan.tag,
        name: uc.clan.name,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  /**
   * Busca um usuário por email
   */
  async findUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    return user;
  }

  /**
   * Busca um usuário por ID
   */
  async findUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    return user;
  }

  /**
   * Busca um clã por tag
   */
  async findClanByTag(tag: string) {
    const clan = await prisma.clan.findUnique({
      where: {
        tag,
      },
    });

    return clan;
  }

  /**
   * Verifica se um usuário já tem acesso a um clã
   */
  async userHasClanAccess(userId: string, clanId: string) {
    const userClan = await prisma.userClan.findFirst({
      where: {
        userId,
        clanId,
      },
    });

    return !!userClan;
  }

  /**
   * Adiciona acesso de um usuário a um clã
   */
  async addClanToUser(userId: string, clanId: string) {
    const userClan = await prisma.userClan.create({
      data: {
        userId,
        clanId,
      },
      include: {
        clan: true,
      },
    });

    return userClan;
  }

  /**
   * Remove acesso de um usuário a um clã
   */
  async removeClanFromUser(userId: string, clanId: string) {
    const userClan = await prisma.userClan.findFirst({
      where: {
        userId,
        clanId,
      },
    });

    if (!userClan) {
      return null;
    }

    await prisma.userClan.delete({
      where: {
        id: userClan.id,
      },
    });

    return { success: true };
  }

  /**
   * Cria um novo clã no banco de dados
   */
  async createClan(tag: string, name: string) {
    const clan = await prisma.clan.create({
      data: {
        tag,
        name,
      },
    });

    return clan;
  }
}

