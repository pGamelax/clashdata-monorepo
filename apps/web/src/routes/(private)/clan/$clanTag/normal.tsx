import { useSuspenseQuery, useQueries, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  getClanInfoQueryOptions,
  getNormalWarsQueryOptions,
  getClanRankingQueryOptions,
} from "@/api";
import { DataTable } from "../-data-table";
import { columns } from "../-columns";
import { CWLSelector } from "../-cwl-selector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Calendar, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Função para obter o mês atual (formato YYYY-MM)
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Função para gerar lista de meses (últimos 12 meses)
function generateMonths(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
  }
  return months;
}

// Função para formatar mês para exibição (ex: "2026-01" -> "Janeiro 2026")
function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-");
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
}


export const Route = createFileRoute("/(private)/clan/$clanTag/normal")({
  loader: async ({ context: { queryClient }, params }) => {
    // Carrega guerras do mês atual
    const currentMonth = getCurrentMonth();
    await queryClient.ensureQueryData(getNormalWarsQueryOptions(params.clanTag, [currentMonth]));
    queryClient.prefetchQuery(getClanRankingQueryOptions(params.clanTag)).catch(() => {});
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
  const currentMonth = getCurrentMonth();
  const [isCWLSelectorOpen, setIsCWLSelectorOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set([currentMonth]));
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const months = useMemo(() => generateMonths(), []);

  const { data: clanStats } = useSuspenseQuery(getClanInfoQueryOptions(clanTag));
  
  // Busca dados do mês atual inicialmente
  const { data: currentMonthData, isLoading: isLoadingCurrent } = useSuspenseQuery({
    ...getNormalWarsQueryOptions(clanTag, [currentMonth]),
    refetchOnMount: true,
  });

  // Busca dados de todos os meses selecionados (exceto o atual que já está carregado)
  const selectedMonthsArray = Array.from(selectedMonths);
  const otherMonths = selectedMonthsArray.filter(m => m !== currentMonth);

  // Usa useQueries para buscar dados de múltiplos meses dinamicamente
  const monthQueries = useQueries({
    queries: otherMonths.map(month => ({
      ...getNormalWarsQueryOptions(clanTag, [month]),
      refetchOnMount: true,
    })),
  });

  // Agrega dados de todos os meses selecionados
  const aggregatedData = useMemo(() => {
    const allPlayers = new Map<string, any>();

    // Adiciona dados do mês atual se selecionado
    if (selectedMonths.has(currentMonth) && currentMonthData?.players) {
      currentMonthData.players.forEach((player: any) => {
        if (!allPlayers.has(player.tag)) {
          allPlayers.set(player.tag, {
            ...player,
            allAttacks: [...player.allAttacks],
            allDefenses: [...player.allDefenses],
          });
        } else {
          const existing = allPlayers.get(player.tag);
          existing.allAttacks.push(...player.allAttacks);
          existing.allDefenses.push(...player.allDefenses);
        }
      });
    }

    // Adiciona dados dos outros meses selecionados
    otherMonths.forEach((_month, index) => {
      const query = monthQueries[index];
      if (query?.data?.players) {
        query.data.players.forEach((player: any) => {
          if (!allPlayers.has(player.tag)) {
            allPlayers.set(player.tag, {
              ...player,
              allAttacks: [...player.allAttacks],
              allDefenses: [...player.allDefenses],
            });
          } else {
            const existing = allPlayers.get(player.tag);
            existing.allAttacks.push(...player.allAttacks);
            existing.allDefenses.push(...player.allDefenses);
          }
        });
      }
    });

    // Processa os dados agregados (recalcula estatísticas)
    const processedPlayers = Array.from(allPlayers.values()).map((player: any) => {
      const attackCount = player.allAttacks.length;
      const defenseCount = player.allDefenses.length;
      const totalStars = player.allAttacks.reduce((acc: number, cur: any) => acc + cur.stars, 0);
      const totalDestr = player.allAttacks.reduce((acc: number, cur: any) => acc + cur.destruction, 0);
      const totalDefStars = player.allDefenses.reduce((acc: number, cur: any) => acc + cur.stars, 0);
      const totalDefDestr = player.allDefenses.reduce((acc: number, cur: any) => acc + cur.destruction, 0);

      // Identifica guerras únicas (por data e oponente)
      const uniqueWars = new Set<string>();
      player.allAttacks.forEach((att: any) => {
        uniqueWars.add(`${att.date}-${att.opponent}`);
      });
      player.allDefenses.forEach((def: any) => {
        uniqueWars.add(`${def.date}`);
      });

      const K = 1.5;
      const GLOBAL_AVG = 2.0;
      const performanceScore = attackCount > 0 ? (K * GLOBAL_AVG + totalStars) / (K + attackCount) : 0;

      return {
        ...player,
        attackCount,
        warCount: uniqueWars.size,
        performanceScore,
        avgStars: attackCount > 0 ? (totalStars / attackCount).toFixed(2) : "0.00",
        avgDestruction: attackCount > 0 ? (totalDestr / attackCount).toFixed(0) : "0",
        avgDefenseStars: defenseCount > 0 ? (totalDefStars / defenseCount).toFixed(2) : "0.00",
        avgDefenseDestruction: defenseCount > 0 ? (totalDefDestr / defenseCount).toFixed(0) : "0",
        displayAttacks: player.allAttacks,
        displayDefenses: player.allDefenses,
      };
    }).filter((p: any) => p.warCount > 0)
      .sort((a: any, b: any) => b.performanceScore - a.performanceScore);

    return { players: processedPlayers };
  }, [selectedMonths, currentMonth, currentMonthData, otherMonths, monthQueries]);

  const isLoading = isLoadingCurrent || monthQueries.some(q => q.isLoading);

  // Filtra os jogadores por busca
  const clanWars = useMemo(() => {
    if (!aggregatedData?.players) return { players: [] };

    let filteredPlayers = aggregatedData.players.map((p: any) => ({
      ...p,
      allDefenses: p.allDefenses.map((d: any) => ({ ...d, opponent: "" })),
    }));

    // Aplica filtro de busca por nome
    if (searchFilter) {
      filteredPlayers = filteredPlayers.filter((player: any) =>
        player.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        player.tag.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    return { players: filteredPlayers };
  }, [aggregatedData, searchFilter]);


  // Ranking do clã para obter membros atuais
  const { data: clanRanking } = useQuery(getClanRankingQueryOptions(clanTag));

  // Lista de tags dos membros atuais do clã
  const currentClanMemberTags = useMemo(() => {
    return clanRanking?.players?.map((p: any) => p.playerTag) || [];
  }, [clanRanking]);

  const handleMonthToggle = (month: string) => {
    const newSelected = new Set(selectedMonths);
    if (newSelected.has(month)) {
      // Não permite desmarcar se for o único mês selecionado
      if (newSelected.size > 1) {
        newSelected.delete(month);
      }
    } else {
      newSelected.add(month);
    }
    setSelectedMonths(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedMonths(new Set(months));
  };

  const handleDeselectAll = () => {
    setSelectedMonths(new Set([currentMonth]));
  };

  useEffect(() => {
    document.title = `${clanStats.name} - Guerras Normais | Clashdata`;
  }, [clanStats.name]);

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
            {/* Cabeçalho com filtros */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Guerras Normais</h3>
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

                {/* Filtro múltiplo de meses */}
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full sm:w-[250px] h-11 justify-between rounded-xl border-2 border-border/50 bg-muted/30 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
                    >
                      <span className="truncate">
                        {selectedMonths.size === 0
                          ? "Selecione os meses"
                          : selectedMonths.size === 1
                          ? formatMonth(Array.from(selectedMonths)[0])
                          : `${selectedMonths.size} meses selecionados`}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold">Selecionar Meses</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectAll}
                            className="h-7 text-xs"
                          >
                            Todos
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
                      {selectedMonths.size > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Array.from(selectedMonths).map((month) => (
                            <div
                              key={month}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                            >
                              {formatMonth(month)}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (selectedMonths.size > 1) {
                                    handleMonthToggle(month);
                                  }
                                }}
                                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                                disabled={selectedMonths.size === 1}
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
                        {months.map((month) => (
                          <div
                            key={month}
                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleMonthToggle(month)}
                          >
                            <Checkbox
                              id={`month-${month}`}
                              checked={selectedMonths.has(month)}
                              onCheckedChange={() => handleMonthToggle(month)}
                              disabled={selectedMonths.size === 1 && selectedMonths.has(month)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Label
                              htmlFor={`month-${month}`}
                              className="flex-1 cursor-pointer text-sm font-medium"
                            >
                              {formatMonth(month)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Tabela de dados */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : clanWars.players && clanWars.players.length > 0 ? (
              <DataTable columns={columns} data={clanWars.players} hideDateFilters={true} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <p className="text-base font-medium text-foreground mb-1">
                  Nenhum dado encontrado
                </p>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {searchFilter
                    ? "Nenhum jogador encontrado com o termo de busca."
                    : "Este clã ainda não possui dados de guerras normais registrados."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isCWLSelectorOpen} onOpenChange={setIsCWLSelectorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seleção CWL - Liga de Clãs</DialogTitle>
          </DialogHeader>
          <CWLSelector
            players={clanWars.players as any}
            currentClanMembers={currentClanMemberTags}
            clanName={clanStats.name}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
