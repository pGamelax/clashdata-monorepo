import { useSuspenseQuery, useQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  getClanInfoQueryOptions,
  getCWLLatestSeasonQueryOptions,
  getCWLSeasonQueryOptions,
} from "@/api";
import { DataTable } from "../-data-table";
import { cwlColumns } from "../-cwl-columns";
import { Shield, Loader2, Calendar, ChevronDown, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ProcessedPlayer } from "../-types";

// Função para obter a última season (formato YYYY-MM)
function getLatestSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Função para gerar lista de seasons (últimas 12 seasons)
function generateSeasons(): string[] {
  const seasons: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    seasons.push(`${year}-${month}`);
  }
  return seasons;
}

// Função para agregar dados de múltiplas seasons
function aggregateCWLSeasonsData(seasonsData: Array<{ season: string; data: any }>, clanTag: string): ProcessedPlayer[] {
  const normalizedClanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
  const playerMap = new Map<string, any>();

  // Processa cada season
  seasonsData.forEach(({ season, data }) => {
    if (!data?.rounds || !Array.isArray(data.rounds)) return;

    // Processa cada round (guerra) da season
    data.rounds.forEach((round: any) => {
      const warTags = Array.isArray(round.warTags) 
        ? round.warTags 
        : round.warTags 
          ? [round.warTags] 
          : [];

      warTags.forEach((war: any) => {
        if (!war || !war.clan || !war.opponent) return;

        const isUserClan = war.clan.tag === normalizedClanTag;
        const ourClan = isUserClan ? war.clan : war.opponent;
        const enemyClan = isUserClan ? war.opponent : war.clan;

        if (!ourClan || !ourClan.members || !Array.isArray(ourClan.members)) return;

        ourClan.members.forEach((member: any) => {
          if (!member || !member.tag) return;

          if (!playerMap.has(member.tag)) {
            playerMap.set(member.tag, {
              tag: member.tag,
              name: member.name || "",
              townhallLevel: member.townhallLevel || member.townHallLevel || 0,
              allAttacks: [],
              allDefenses: [],
            });
          }

          const player = playerMap.get(member.tag);

          // Adiciona ataques
          if (member.attacks && Array.isArray(member.attacks)) {
            member.attacks.forEach((attack: any) => {
              if (attack) {
                player.allAttacks.push({
                  date: war.endTime || war.startTime || new Date().toISOString(),
                  stars: attack.stars || 0,
                  destruction: attack.destructionPercentage || 0,
                  opponent: enemyClan.name || "",
                  defenderTag: attack.defenderTag || "",
                  season: season, // Adiciona a season para rastreamento
                });
              }
            });
          }

          // Adiciona defesas
          if (member.bestOpponentAttack) {
            player.allDefenses.push({
              date: war.endTime || war.startTime || new Date().toISOString(),
              stars: member.bestOpponentAttack.stars || 0,
              destruction: member.bestOpponentAttack.destructionPercentage || 0,
              season: season,
            });
          }
        });
      });
    });
  });

  // Processa os dados agregados
  return processPlayerData(playerMap);
}

// Função para processar dados de CWL da API e transformar em ProcessedPlayer[]
function processCWLSeasonData(apiData: any, clanTag: string): ProcessedPlayer[] {
  if (!apiData?.rounds || !Array.isArray(apiData.rounds)) {
    return [];
  }

  const normalizedClanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
  const playerMap = new Map<string, any>();

  // Processa cada round (guerra) da season
  if (Array.isArray(apiData.rounds)) {
    apiData.rounds.forEach((round: any) => {
      // warTags pode ser um array ou um objeto
      const warTags = Array.isArray(round.warTags) 
        ? round.warTags 
        : round.warTags 
          ? [round.warTags] 
          : [];

      warTags.forEach((war: any) => {
        if (!war || !war.clan || !war.opponent) return;

        // Determina qual é o clã do usuário
        const isUserClan = war.clan.tag === normalizedClanTag;
        const ourClan = isUserClan ? war.clan : war.opponent;
        const enemyClan = isUserClan ? war.opponent : war.clan;

        if (!ourClan || !ourClan.members || !Array.isArray(ourClan.members)) return;

        // Processa cada membro do clã
        ourClan.members.forEach((member: any) => {
          if (!member || !member.tag) return;

          if (!playerMap.has(member.tag)) {
            playerMap.set(member.tag, {
              tag: member.tag,
              name: member.name || "",
              townhallLevel: member.townhallLevel || member.townHallLevel || 0,
              allAttacks: [],
              allDefenses: [],
            });
          }

          const player = playerMap.get(member.tag);

          // Adiciona ataques
          if (member.attacks && Array.isArray(member.attacks)) {
            member.attacks.forEach((attack: any) => {
              if (attack) {
                player.allAttacks.push({
                  date: war.endTime || war.startTime || new Date().toISOString(),
                  stars: attack.stars || 0,
                  destruction: attack.destructionPercentage || 0,
                  opponent: enemyClan.name || "",
                  defenderTag: attack.defenderTag || "", // Para identificar bases únicas
                });
              }
            });
          }

          // Adiciona defesas
          if (member.bestOpponentAttack) {
            player.allDefenses.push({
              date: war.endTime || war.startTime || new Date().toISOString(),
              stars: member.bestOpponentAttack.stars || 0,
              destruction: member.bestOpponentAttack.destructionPercentage || 0,
            });
          }
        });
      });
    });
  }

  // Processa os dados para criar ProcessedPlayer[]
  return processPlayerData(playerMap);
}

// Função auxiliar para processar dados de jogadores
function processPlayerData(playerMap: Map<string, any>): ProcessedPlayer[] {
  const K = 1.5; // Constante de suavização
  const GLOBAL_AVG = 2.0; // Média global de estrelas

  const processed: ProcessedPlayer[] = Array.from(playerMap.values())
    .map((player) => {
      const playerUniqueWars = new Set<string>();
      const totalPts = new Set<string>();

      player.allAttacks.forEach((att: any) => {
        if (att.stars === 3) {
          // Usa defenderTag se disponível, senão usa combinação de data, oponente e season
          const uniqueKey = att.defenderTag 
            ? att.defenderTag 
            : `${att.date}-${att.opponent}-${att.season || ""}`;
          totalPts.add(uniqueKey);
        }
        // Usa combinação de data e season para identificar guerras únicas
        const warKey = `${att.date}-${att.season || ""}`;
        playerUniqueWars.add(warKey);
      });
      player.allDefenses.forEach((def: any) => {
        const warKey = `${def.date}-${def.season || ""}`;
        playerUniqueWars.add(warKey);
      });

      const attackCount = player.allAttacks.length;
      const playerWarCount = playerUniqueWars.size;
      const totalStars = player.allAttacks.reduce((acc: number, cur: any) => acc + cur.stars, 0);
      const totalDestr = player.allAttacks.reduce(
        (acc: number, cur: any) => acc + cur.destruction,
        0,
      );

      const performanceScore =
        attackCount > 0 ? (K * GLOBAL_AVG + totalStars) / (K + attackCount) : 0;

      const defenseCount = player.allDefenses.length;
      const totalDefStars = player.allDefenses.reduce((acc: number, cur: any) => acc + cur.stars, 0);
      const totalDefDestr = player.allDefenses.reduce(
        (acc: number, cur: any) => acc + cur.destruction,
        0,
      );

      return {
        ...player,
        totalPts: totalPts.size,
        attackCount,
        warCount: playerWarCount,
        performanceScore,
        avgStars: attackCount > 0 ? (totalStars / attackCount).toFixed(2) : "0.00",
        avgDestruction:
          attackCount > 0 ? (totalDestr / attackCount).toFixed(0) : "0",
        avgDefenseStars:
          defenseCount > 0
            ? (totalDefStars / defenseCount).toFixed(2)
            : "0.00",
        avgDefenseDestruction:
          defenseCount > 0 ? (totalDefDestr / defenseCount).toFixed(0) : "0",
        displayAttacks: player.allAttacks,
        displayDefenses: player.allDefenses,
      };
    })
    .filter((p) => p.warCount > 0)
    .sort((a, b) => b.performanceScore - a.performanceScore);

  return processed;
}

export const Route = createFileRoute("/(private)/clan/$clanTag/cwl")({
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData(getCWLLatestSeasonQueryOptions(params.clanTag));
  },
  pendingComponent: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ),
  component: RouteComponent,
});

function RouteComponent() {
  const { clanTag } = Route.useParams();
  const latestSeason = getLatestSeason();
  const [selectedSeasons, setSelectedSeasons] = useState<Set<string>>(new Set([latestSeason]));
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const seasons = useMemo(() => generateSeasons(), []);

  const { data: clanStats } = useSuspenseQuery(getClanInfoQueryOptions(clanTag));
  
  // Busca dados da última season inicialmente
  const { data: latestSeasonData, isLoading: isLoadingLatest } = useSuspenseQuery({
    ...getCWLLatestSeasonQueryOptions(clanTag),
    refetchOnMount: true,
  });

  // Busca dados de todas as seasons selecionadas (exceto a última que já está carregada)
  const selectedSeasonsArray = Array.from(selectedSeasons);
  const otherSeasons = selectedSeasonsArray.filter(s => s !== latestSeason);

  // Usa useQueries para buscar dados de múltiplas seasons dinamicamente
  const seasonQueries = useQueries({
    queries: otherSeasons.map(season => ({
      ...getCWLSeasonQueryOptions(clanTag, season),
      refetchOnMount: true,
    })),
  });

  // Processa os dados agregados de todas as seasons selecionadas
  const processedCWLPlayers = useMemo(() => {
    const seasonsData: Array<{ season: string; data: any }> = [];

    // Adiciona dados da última season se selecionada
    if (selectedSeasons.has(latestSeason) && latestSeasonData) {
      seasonsData.push({ season: latestSeason, data: latestSeasonData });
    }

    // Adiciona dados das outras seasons selecionadas
    otherSeasons.forEach((season, index) => {
      const query = seasonQueries[index];
      if (query?.data) {
        seasonsData.push({ season, data: query.data });
      }
    });

    if (seasonsData.length === 0) return [];

    // Se apenas uma season, usa processamento simples
    if (seasonsData.length === 1) {
      return processCWLSeasonData(seasonsData[0].data, clanTag);
    }

    // Se múltiplas seasons, agrega os dados
    return aggregateCWLSeasonsData(seasonsData, clanTag);
  }, [selectedSeasons, latestSeason, latestSeasonData, otherSeasons, seasonQueries, clanTag]);

  // Filtra os jogadores por busca
  const cwlPlayers = useMemo(() => {
    if (!processedCWLPlayers || processedCWLPlayers.length === 0) return [];

    if (!searchFilter) return processedCWLPlayers;

    return processedCWLPlayers.filter((player: any) =>
      player.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      player.tag.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [processedCWLPlayers, searchFilter]);

  const isLoading = isLoadingLatest || seasonQueries.some(q => q.isLoading);

  const handleSeasonToggle = (season: string) => {
    const newSelected = new Set(selectedSeasons);
    if (newSelected.has(season)) {
      // Não permite desmarcar se for a última season selecionada
      if (newSelected.size > 1) {
        newSelected.delete(season);
      }
    } else {
      newSelected.add(season);
    }
    setSelectedSeasons(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedSeasons(new Set(seasons));
  };

  const handleDeselectAll = () => {
    setSelectedSeasons(new Set([latestSeason]));
  };

  useEffect(() => {
    document.title = `${clanStats.name} - CWL | Clashdata`;
  }, [clanStats.name]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Seletor Múltiplo de Seasons */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Seasons de CWL</h3>
            {selectedSeasons.size > 1 && (
              <span className="text-sm text-muted-foreground">
                ({selectedSeasons.size} selecionadas)
              </span>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Busca por jogador */}
            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar jogador..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9 h-11 rounded-xl border-2 border-border/50 bg-muted/30 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
              />
            </div>

            {/* Filtro múltiplo de seasons */}
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full sm:w-[250px] h-11 justify-between rounded-xl border-2 border-border/50 bg-muted/30 backdrop-blur-sm"
                >
                  <span className="truncate">
                    {selectedSeasons.size === 0
                      ? "Selecione as seasons"
                      : selectedSeasons.size === 1
                      ? Array.from(selectedSeasons)[0]
                      : `${selectedSeasons.size} seasons selecionadas`}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Selecionar Seasons</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-7 text-xs"
                    >
                      Todas
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeselectAll}
                      className="h-7 text-xs"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
                {selectedSeasons.size > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Array.from(selectedSeasons).map((season) => (
                      <div
                        key={season}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                      >
                        {season}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedSeasons.size > 1) {
                              handleSeasonToggle(season);
                            }
                          }}
                          className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                          disabled={selectedSeasons.size === 1}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2">
                <div className="space-y-2">
                  {seasons.map((season) => (
                    <div
                      key={season}
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleSeasonToggle(season)}
                    >
                      <Checkbox
                        id={`season-${season}`}
                        checked={selectedSeasons.has(season)}
                        onCheckedChange={() => handleSeasonToggle(season)}
                        disabled={selectedSeasons.size === 1 && selectedSeasons.has(season)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label
                        htmlFor={`season-${season}`}
                        className="flex-1 cursor-pointer text-sm font-medium"
                      >
                        {season}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : cwlPlayers && cwlPlayers.length > 0 ? (
          <DataTable columns={cwlColumns} data={cwlPlayers} hideDateFilters={true} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Shield className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-base font-medium text-foreground mb-1">
              Nenhum dado encontrado
            </p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {searchFilter
                ? "Nenhum jogador encontrado com o termo de busca."
                : "Este clã ainda não possui dados de guerras da Liga de Clãs registrados para esta season."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
