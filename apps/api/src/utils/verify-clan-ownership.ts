import { prisma } from "@/lib/prisma";
import { Forbidden } from "@/errors/Errors";

/**
 * Verifica se um clan pertence ao usuário logado (usando tabela users_clans)
 * e se o plano do clan está ativo
 * @param clanTag - Tag do clan (normalizado com #)
 * @param userId - ID do usuário logado
 * @throws {Forbidden} Se o clan não pertencer ao usuário, não existir ou o plano não estiver ativo
 */
export async function verifyClanOwnership(clanTag: string, userId: string): Promise<void> {
  // Busca o clan pela tag com o plano
  const clan = await prisma.clan.findFirst({
    where: {
      tag: clanTag,
    },
    include: {
      plan: true,
    },
  });

  if (!clan) {
    throw new Forbidden("Clan não encontrado ou não cadastrado");
  }

  // Verifica se o usuário tem acesso a este clan através da tabela users_clans
  const userClan = await prisma.userClan.findFirst({
    where: {
      userId: userId,
      clanId: clan.id,
    },
  });

  if (!userClan) {
    throw new Forbidden("Você não tem permissão para acessar este clan");
  }

  // Verifica se o plano do clan está ativo
  if (!clan.plan || !clan.plan.isActive) {
    throw new Forbidden("O plano do seu clã expirou ou está inativo. Entre em contato com o administrador para ativar o plano.");
  }
}
