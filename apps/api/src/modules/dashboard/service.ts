import { prisma } from "@/lib/prisma";
import { verifyClanOwnership } from "@/utils/verify-clan-ownership";

export class DashboardService {
  async getDashboardFromAPI(params: { clanTag: string; userId: string; limit?: number }) {
    const { clanTag, userId, limit } = params;

    // Verifica se o clan pertence ao usuário logado
    await verifyClanOwnership(clanTag, userId);

    // Calcula data de 4 meses atrás
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
    const fourMonthsAgoISO = fourMonthsAgo.toISOString();

    // Busca apenas o necessário para os últimos 4 meses
    // CWL: 4 meses × 7 guerras = 28 guerras CWL
    // Normais: aproximadamente 60 guerras (1 a cada 2 dias em 4 meses)
    // Total: ~88 guerras, buscamos 100 para ter margem de segurança
    const estimatedLimit = limit || 100;
    const response = await fetch(
      `https://api.clashk.ing/war/${encodeURIComponent(clanTag)}/previous?limit=${estimatedLimit}`,
    );
    const apiData = await response.json();
    
    // Separa guerras normais de CWL e filtra por data (últimos 4 meses)
    const normalWars: any[] = [];
    const cwlWars: any[] = [];

    apiData.items.forEach((war: any) => {
      // Verifica se a guerra está dentro dos últimos 4 meses
      const warEndTime = new Date(war.endTime);
      if (warEndTime < fourMonthsAgo) {
        return; // Ignora guerras mais antigas que 4 meses
      }

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

    // Limita CWL para 28 guerras (4 meses × 7 guerras por mês)
    // Ordena por data mais recente primeiro
    const sortedCWLWars = cwlWars.sort((a, b) => 
      new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    );
    const recentCWLWars = sortedCWLWars.slice(0, 28);

    // Limita guerras normais para aproximadamente 60 (últimos 4 meses)
    // Ordena por data mais recente primeiro
    const sortedNormalWars = normalWars.sort((a, b) => 
      new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    );
    const recentNormalWars = sortedNormalWars.slice(0, 60);

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
    recentCWLWars.forEach((war: any) => {
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
