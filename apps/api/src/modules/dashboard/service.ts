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
          return null;
        }
        const errorText = await response.text();
        throw new Error(`Failed to fetch current war: ${response.statusText}`);
      }

      const warData = await response.json();
      return warData;
    } catch (error) {
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

  async getNormalWarsFromAPI(params: { clanTag: string; userId: string; months?: string[] }) {
    const { clanTag, userId, months } = params;

    // Verifica se o clan pertence ao usuário logado
    await verifyClanOwnership(clanTag, userId);

    // Se meses não foram especificados, usa o mês atual
    const targetMonths = months && months.length > 0 
      ? months 
      : [this.getLatestSeason()]; // getLatestSeason retorna YYYY-MM

    // Identifica o mês atual
    const currentMonth = this.getLatestSeason();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let fetchLimit = 0;
    const hasCurrentMonth = targetMonths.includes(currentMonth);
    const pastMonths = targetMonths.filter(m => m !== currentMonth);

    if (hasCurrentMonth) {
      // Para o mês atual, busca um número maior para garantir que pegamos todas até hoje
      // Considerando que pode ter CWL no meio, buscamos mais
      fetchLimit += 100; // Margem de segurança para o mês atual
    }

    // Para cada mês passado, busca até 45 guerras (18 normais + margem para CWL)
    // Multiplica por 2.5 para ter margem de segurança (18 normais + ~27 CWL possíveis)
    fetchLimit += pastMonths.length * 45;

    // Mínimo de 100 para garantir que sempre buscamos dados suficientes
    fetchLimit = Math.max(fetchLimit, 100);

    const response = await fetch(
      `https://api.clashk.ing/war/${encodeURIComponent(clanTag)}/previous?limit=${fetchLimit}`,
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wars: ${response.statusText}`);
    }
    
    const apiData = await response.json();
    
    // A API pode retornar um array diretamente ou um objeto com items
    let wars: any[] = [];
    if (Array.isArray(apiData)) {
      wars = apiData;
    } else if (apiData.items && Array.isArray(apiData.items)) {
      wars = apiData.items;
    } else {
      return {
        players: [],
        totalNormalWars: 0,
      };
    }
    
    // Filtra apenas guerras normais (não CWL) e por mês baseado na data real
    const normalWars: any[] = [];
    const normalWarsByMonth = new Map<string, number>(); // Contador de guerras normais por mês
    
    wars.forEach((war: any) => {
      // CWL tem 'season' e 'warStartTime', guerras normais não têm season
      const isCWL = !!(war.season && war.warStartTime);
      
      // Se é CWL, pula (desconta automaticamente)
      if (isCWL) {
        return;
      }

      // Verifica se tem endTime (obrigatório para processar)
      if (!war.endTime) {
        return;
      }

      try {
        // Converte o formato ISO compacto (20260129T012038.000Z) para formato padrão
        // Formato: YYYYMMDDTHHmmss.sssZ -> YYYY-MM-DDTHH:mm:ss.sssZ
        let dateString = war.endTime;
        if (typeof dateString === 'string' && dateString.length >= 15) {
          // Se não tem hífens, adiciona (formato compacto)
          if (!dateString.includes('-') && dateString.match(/^\d{8}T/)) {
            // YYYYMMDDTHHmmss... -> YYYY-MM-DDTHH:mm:ss...
            dateString = `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}T${dateString.substring(9, 11)}:${dateString.substring(11, 13)}:${dateString.substring(13)}`;
          }
        }
        
        const warDate = new Date(dateString);
        // Verifica se a data é válida
        if (isNaN(warDate.getTime())) {
          return;
        }
        
        const warMonth = `${warDate.getFullYear()}-${String(warDate.getMonth() + 1).padStart(2, "0")}`;
        
        // Verifica se a guerra está em um dos meses selecionados
        if (targetMonths.includes(warMonth)) {
          // Para o mês atual, verifica se a guerra é até hoje
          if (warMonth === currentMonth) {
            const warDateOnly = new Date(warDate.getFullYear(), warDate.getMonth(), warDate.getDate());
            if (warDateOnly > today) {
              // Guerra no futuro (não deveria acontecer, mas filtra por segurança)
              return;
            }
          }
          
          // Para meses passados, limita a 18 guerras normais por mês
          if (warMonth !== currentMonth) {
            const currentCount = normalWarsByMonth.get(warMonth) || 0;
            if (currentCount >= 18) {
              // Já temos 18 guerras normais deste mês, não adiciona mais
              return;
            }
            normalWarsByMonth.set(warMonth, currentCount + 1);
          }
          
          normalWars.push(war);
        }
      } catch (error) {
        // Ignora guerras com data inválida
        return;
      }
    });

    // Ordena por data mais recente primeiro
    const sortedNormalWars = normalWars.sort((a, b) => 
      new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    );

    // Não aplica paginação - retorna todas as guerras do(s) mês(es) selecionado(s)
    const paginatedWars = sortedNormalWars;

    // Normaliza o clanTag para comparação (garante que tenha #)
    const normalizedClanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
    
    // Processa guerras normais
    const playerMap = new Map<string, any>();
    
    paginatedWars.forEach((war: any) => {
      // Normaliza as tags da guerra para comparação
      const warClanTag = war.clan?.tag ? (war.clan.tag.startsWith("#") ? war.clan.tag : `#${war.clan.tag}`) : "";
      const warOpponentTag = war.opponent?.tag ? (war.opponent.tag.startsWith("#") ? war.opponent.tag : `#${war.opponent.tag}`) : "";
      
      const isNormalOrder = warClanTag === normalizedClanTag;
      const ourClan = isNormalOrder ? war.clan : war.opponent;
      const enemyClan = isNormalOrder ? war.opponent : war.clan;
      
      // Verifica se ourClan e enemyClan existem e têm members
      if (!ourClan || !ourClan.members || !Array.isArray(ourClan.members)) {
        return;
      }

      ourClan.members.forEach((member: any) => {
        if (!member || !member.tag) {
          return;
        }
        
        if (!playerMap.has(member.tag)) {
          playerMap.set(member.tag, {
            tag: member.tag,
            name: member.name || "",
            townhallLevel: member.townhallLevel || 0,
            allAttacks: [],
            allDefenses: [],
          });
        }

        const p = playerMap.get(member.tag);

        if (member.attacks && Array.isArray(member.attacks)) {
          member.attacks.forEach((att: any) => {
            if (att) {
              p.allAttacks.push({
                date: war.endTime,
                stars: att.stars || 0,
                destruction: att.destructionPercentage || 0,
                opponent: enemyClan?.name || "Unknown",
              });
            }
          });
        }

        if (member.bestOpponentAttack) {
          p.allDefenses.push({
            date: war.endTime,
            stars: member.bestOpponentAttack.stars || 0,
            destruction: member.bestOpponentAttack.destructionPercentage || 0,
          });
        }
      });
    });

    return {
      players: Array.from(playerMap.values()),
      totalNormalWars: sortedNormalWars.length, // Total de guerras normais disponíveis nos meses selecionados
    };
  }
}
