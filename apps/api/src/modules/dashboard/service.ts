import { prisma } from "@/lib/prisma";
import { verifyClanOwnership } from "@/utils/verify-clan-ownership";

export class DashboardService {
  async getDashboardFromAPI(params: { clanTag: string; userId: string }) {
    const { clanTag, userId } = params;

    // Verifica se o clan pertence ao usuário logado
    await verifyClanOwnership(clanTag, userId);

    const response = await fetch(
      `https://api.clashk.ing/war/${encodeURIComponent(clanTag)}/previous?limit=50`,
    );
    const apiData = await response.json();
    const playerMap = new Map<string, any>();

    apiData.items.forEach((war: any) => {
      const isNormalOrder = war.clan.tag === clanTag;
      const ourClan = isNormalOrder ? war.clan : war.opponent;
      const enemyClan = isNormalOrder ? war.opponent : war.clan;

      if (!war.tag) {
        ourClan.members.forEach((member: any) => {
          if (!playerMap.has(member.tag)) {
            playerMap.set(member.tag, {
              tag: member.tag,
              name: member.name,
              townhallLevel: member.townhallLevel,
              allAttacks: [],
              allDefenses: [],
            });
          }

          const p = playerMap.get(member.tag);

          if (member.attacks) {
            member.attacks.forEach((att: any) => {
              p.allAttacks.push({
                date: war.endTime,
                stars: att.stars,
                destruction: att.destructionPercentage,
                opponent: enemyClan.name,
              });
            });
          }

          if (member.bestOpponentAttack) {
            p.allDefenses.push({
              date: war.endTime,
              stars: member.bestOpponentAttack.stars,
              destruction: member.bestOpponentAttack.destructionPercentage,
            });
          }
        });
      }
    });
    return { players: Array.from(playerMap.values()) };
  }
}
