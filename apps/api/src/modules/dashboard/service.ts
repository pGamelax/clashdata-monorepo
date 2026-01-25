import { prisma } from "@/lib/prisma";
import { verifyClanOwnership } from "@/utils/verify-clan-ownership";

export class DashboardService {
  async getDashboardFromAPI(params: { clanTag: string; userId: string; limit?: number }) {
    const { clanTag, userId, limit = 150 } = params;

    // Verifica se o clan pertence ao usuário logado
    await verifyClanOwnership(clanTag, userId);

    // Busca guerras (pode ser limitado para carregamento rápido inicial)
    const response = await fetch(
      `https://api.clashk.ing/war/${encodeURIComponent(clanTag)}/previous?limit=${limit}`,
    );
    const apiData = await response.json();
    
    // Separa guerras normais de CWL
    const normalWars: any[] = [];
    const cwlWars: any[] = [];

    apiData.items.forEach((war: any) => {
      // CWL tem 'season' e 'warStartTime', random wars têm 'attacksPerMember' e 'battleModifier'
      // CWL pode ter war.tag, mas sempre tem season
      const isCWL = !!(war.season && war.warStartTime);
      
      if (isCWL) {
        cwlWars.push(war);
      } else {
        // Guerras normais não têm season, podem ter attacksPerMember
        // Se não tem season, é guerra normal
        if (!war.season) {
          normalWars.push(war);
        }
      }
    });

    // Pega as 50 guerras normais mais recentes (ou todas se houver menos)
    const recentNormalWars = normalWars.slice(0, 50);

    // Processa guerras normais
    const playerMap = new Map<string, any>();
    recentNormalWars.forEach((war: any) => {
      const isNormalOrder = war.clan.tag === clanTag;
      const ourClan = isNormalOrder ? war.clan : war.opponent;
      const enemyClan = isNormalOrder ? war.opponent : war.clan;

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
    });

    // Processa guerras CWL
    const cwlPlayerMap = new Map<string, any>();
    cwlWars.forEach((war: any) => {
      const isNormalOrder = war.clan.tag === clanTag;
      const ourClan = isNormalOrder ? war.clan : war.opponent;
      const enemyClan = isNormalOrder ? war.opponent : war.clan;

      ourClan.members.forEach((member: any) => {
        if (!cwlPlayerMap.has(member.tag)) {
          cwlPlayerMap.set(member.tag, {
            tag: member.tag,
            name: member.name,
            townhallLevel: member.townhallLevel,
            allAttacks: [],
            allDefenses: [],
          });
        }

        const p = cwlPlayerMap.get(member.tag);

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
    });

    return {
      players: Array.from(playerMap.values()),
      cwlPlayers: Array.from(cwlPlayerMap.values()),
    };
  }
}
