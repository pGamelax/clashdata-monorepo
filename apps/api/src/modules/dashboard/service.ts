import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import { verifyClanOwnership } from "@/utils/verify-clan-ownership";

export class DashboardService {
  async getDashboardFromAPI(params: { clanTag: string; userId: string; limit?: number; offset?: number }) {
    const { clanTag, userId, limit, offset = 0 } = params;

    // Verifica se o clan pertence ao usuário logado
    await verifyClanOwnership(clanTag, userId);

    // Calcula data de 4 meses atrás
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
    const fourMonthsAgoISO = fourMonthsAgo.toISOString();

    // Busca apenas o necessário para os últimos 4 meses
    // CWL: 4 meses × 7 guerras = 28 guerras CWL
    // Normais: aproximadamente 60 guerras (1 a cada 2 dias em 4 meses)
    // Total: ~88 guerras, buscamos mais para ter margem de segurança
    // Se há offset, precisamos buscar mais itens para poder aplicar o offset
    const fetchLimit = limit ? limit + offset : 100 + offset;
    const response = await fetch(
      `https://api.clashk.ing/war/${encodeURIComponent(clanTag)}/previous?limit=${fetchLimit}`,
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

    // Ordena por data mais recente primeiro
    const sortedCWLWars = cwlWars.sort((a, b) => 
      new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    );
    const sortedNormalWars = normalWars.sort((a, b) => 
      new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    );

    // Aplica paginação se limit foi especificado
    let recentCWLWars = sortedCWLWars;
    let recentNormalWars = sortedNormalWars;
    
    if (limit) {
      // Aplica offset e limit para CWL
      const cwlStart = offset || 0;
      const cwlEnd = cwlStart + limit;
      recentCWLWars = sortedCWLWars.slice(cwlStart, cwlEnd);
      
      // Aplica offset e limit para guerras normais
      const normalStart = offset || 0;
      const normalEnd = normalStart + limit;
      recentNormalWars = sortedNormalWars.slice(normalStart, normalEnd);
    } else {
      // Limita para os últimos 4 meses se não há limit especificado
      recentCWLWars = sortedCWLWars.slice(0, 28);
      recentNormalWars = sortedNormalWars.slice(0, 60);
    }

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

  async getCurrentWar(params: { clanTag: string; userId: string }) {
    const { clanTag, userId } = params;

    // Verifica se o clan pertence ao usuário logado
    await verifyClanOwnership(clanTag, userId);

    try {
      // Busca guerra atual da API externa
      const response = await fetch(
        `https://api.clashofclans.com/v1/clans/${encodeURIComponent(clanTag)}/currentwar`,
        { headers: { Authorization: `Bearer ${env.TOKEN_COC}` } },
      );

      if (!response.ok) {
        // Se não há guerra atual, retorna null
        if (response.status === 404) {
          console.log(`Nenhuma guerra atual encontrada para o clã ${clanTag}`);
          return null;
        }
        const errorText = await response.text();
        console.error(`Erro ao buscar guerra atual: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch current war: ${response.statusText}`);
      }

      const warData = await response.json();
      console.log(`Guerra atual encontrada para o clã ${clanTag}:`, {
        state: warData?.state,
        hasClan: !!warData?.clan,
        hasOpponent: !!warData?.opponent,
        clanTag: warData?.clan?.tag,
        opponentTag: warData?.opponent?.tag,
      });
      return warData;
    } catch (error) {
      console.error(`Erro ao buscar guerra atual para ${clanTag}:`, error);
      // Retorna null em caso de erro (melhor que quebrar a aplicação)
      return null;
    }
  }

  async getWarHistory(params: { clanTag: string; userId: string; limit?: number; offset?: number }) {
    const { clanTag, userId, limit = 10, offset = 0 } = params;

    // Verifica se o clan pertence ao usuário logado
    await verifyClanOwnership(clanTag, userId);

    // Busca histórico de guerras da API clashk.ing
    // Busca mais itens do que necessário para ter margem de segurança
    const fetchLimit = limit + offset;
    const response = await fetch(
      `https://api.clashk.ing/war/${encodeURIComponent(clanTag)}/previous?limit=${fetchLimit}`,
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch war history: ${response.statusText}`);
    }

    const apiData = await response.json();
    
    // Aplica paginação manualmente (a API não suporta offset diretamente)
    const items = apiData.items || [];
    const paginatedItems = items.slice(offset, offset + limit);
    
    return {
      items: paginatedItems,
      total: items.length, // Total disponível na resposta atual
      hasMore: items.length >= offset + limit, // Indica se há mais itens
    };
  }

  async getCWLSeasonData(params: { clanTag: string; userId: string; season: string }) {
    const { clanTag, userId, season } = params;

    // Verifica se o clan pertence ao usuário logado
    await verifyClanOwnership(clanTag, userId);

    // Busca dados de CWL da API clashk.ing
    const response = await fetch(
      `https://api.clashk.ing/cwl/${encodeURIComponent(clanTag)}/${season}`,
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CWL season data: ${response.statusText}`);
    }

    const apiData = await response.json();
    
    return apiData;
  }

  // Função auxiliar para obter a última season (formato YYYY-MM)
  getLatestSeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  async getNormalWarsFromAPI(params: { clanTag: string; userId: string; limit?: number; offset?: number }) {
    const { clanTag, userId, limit = 5, offset = 0 } = params;

    // Verifica se o clan pertence ao usuário logado
    await verifyClanOwnership(clanTag, userId);

    // Busca guerras da API, começando com um limite maior para garantir que temos pelo menos 'limit' guerras normais
    // Se limit é 5, buscamos pelo menos 10-15 para garantir que temos 5 normais mesmo se houver CWL no meio
    const fetchLimit = Math.max(limit * 3, 15) + offset;
    const response = await fetch(
      `https://api.clashk.ing/war/${encodeURIComponent(clanTag)}/previous?limit=${fetchLimit}`,
    );
    const apiData = await response.json();
    
    // Filtra apenas guerras normais (não CWL)
    const normalWars: any[] = [];
    
    apiData.items.forEach((war: any) => {
      // CWL tem 'season' e 'warStartTime', guerras normais não têm season
      const isCWL = !!(war.season && war.warStartTime);
      
      // Se não é CWL, é guerra normal
      if (!isCWL && !war.season) {
        normalWars.push(war);
      }
    });

    // Ordena por data mais recente primeiro
    const sortedNormalWars = normalWars.sort((a, b) => 
      new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    );

    // Aplica paginação - pega apenas as 'limit' guerras normais a partir do 'offset'
    const paginatedWars = sortedNormalWars.slice(offset, offset + limit);

    // Processa guerras normais
    const playerMap = new Map<string, any>();
    paginatedWars.forEach((war: any) => {
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

    return {
      players: Array.from(playerMap.values()),
      totalNormalWars: sortedNormalWars.length, // Total de guerras normais disponíveis
      hasMore: (offset + limit) < sortedNormalWars.length,
    };
  }
}
