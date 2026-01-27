import { Plus, Minus, Trophy, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { useMemo, useState, startTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { getConfigsQueryOptions } from "@/api/queries/seasons";
import type { ClanLogsResponse } from "@/api/types";
import type { PlayerDayLog } from "./-columns";

interface LegendAttacksProps {
  legendLogs?: ClanLogsResponse;
  isLoading?: boolean;
  isFetching?: boolean;
  clanTag: string;
}

export function LegendAttacks({
  legendLogs,
  isLoading,
  isFetching,
}: LegendAttacksProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>("current");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Busca todas as configurações de temporada
  const { data: seasonConfigs } = useQuery({
    ...getConfigsQueryOptions,
  });

  // Filtra os dados baseado na temporada selecionada
  const filteredData = useMemo(() => {
    if (!legendLogs) {
      return legendLogs;
    }

    // Se não há configurações de temporada, mostra todas as datas
    if (!seasonConfigs || seasonConfigs.length === 0) {
      return {
        ...legendLogs,
        dates: legendLogs.dates || [],
        datesData: legendLogs.datesData || {},
      };
    }

    // Ordena as temporadas por data (mais recente primeiro)
    const sortedSeasons = [...seasonConfigs].sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );

    // Se selecionou "current" (Temporada Atual)
    if (selectedSeasonId === "current") {
      const lastSeason = sortedSeasons[0];
      const lastSeasonDate = new Date(lastSeason.scheduledAt);
      // A temporada atual começa no mesmo dia da última temporada cadastrada
      // Exemplo: se última temporada é 26/01/2026 2:00, temporada atual começa em 26/01/2026
      const lastSeasonDateOnly = format(lastSeasonDate, "yyyy-MM-dd");

      // Mostra apenas datas >= data da última temporada (temporada atual)
      const filteredDates = (legendLogs.dates || []).filter((dateStr) => {
        return dateStr >= lastSeasonDateOnly;
      });

      const filteredDatesData: Record<string, any[]> = {};
      filteredDates.forEach((dateStr) => {
        if (legendLogs.datesData?.[dateStr]) {
          filteredDatesData[dateStr] = legendLogs.datesData[dateStr];
        }
      });

      return {
        ...legendLogs,
        dates: filteredDates,
        datesData: filteredDatesData,
      };
    }


    const selectedSeason = sortedSeasons.find((config) => config.id === selectedSeasonId);
    if (!selectedSeason) {
      return {
        ...legendLogs,
        dates: legendLogs.dates || [],
        datesData: legendLogs.datesData || {},
      };
    }


    const selectedSeasonDate = new Date(selectedSeason.scheduledAt);
    const selectedSeasonDateOnly = format(selectedSeasonDate, "yyyy-MM-dd");
    

    const selectedIndex = sortedSeasons.findIndex((s) => s.id === selectedSeasonId);
    const nextSeason = sortedSeasons[selectedIndex - 1];
    

    const filteredDates = (legendLogs.dates || []).filter((dateStr) => {
      if (nextSeason) {
        const nextSeasonDate = new Date(nextSeason.scheduledAt);
        const nextSeasonDateOnly = format(nextSeasonDate, "yyyy-MM-dd");

        return dateStr >= selectedSeasonDateOnly && dateStr < nextSeasonDateOnly;
      } else {
        const penultimateSeason = sortedSeasons[1];
        if (penultimateSeason) {
          const penultimateSeasonDate = new Date(penultimateSeason.scheduledAt);
          const penultimateSeasonDateOnly = format(penultimateSeasonDate, "yyyy-MM-dd");
         
          return dateStr >= penultimateSeasonDateOnly && dateStr < selectedSeasonDateOnly;
        }
        
        return dateStr < selectedSeasonDateOnly;
      }
    });


    const filteredDatesData: Record<string, any[]> = {};
    filteredDates.forEach((dateStr) => {
      if (legendLogs.datesData?.[dateStr]) {
        filteredDatesData[dateStr] = legendLogs.datesData[dateStr];
      }
    });

    return {
      ...legendLogs,
      dates: filteredDates,
      datesData: filteredDatesData,
    };
    }, [legendLogs, selectedSeasonId, seasonConfigs]);

  // Seleciona a data atual ou a primeira disponível
  const currentDate = selectedDate || filteredData?.dates?.[0] || null;
  const currentData = useMemo(() => {
    return currentDate && filteredData?.datesData?.[currentDate] 
      ? (filteredData.datesData[currentDate] as PlayerDayLog[]) 
      : [];
  }, [currentDate, filteredData]);


  const sortedData = useMemo(() => {
    return [...currentData].sort((a, b) => b.final - a.final);
  }, [currentData]);


  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleDateChange = (date: string | null) => {
    startTransition(() => {
      setSelectedDate(date);
      setCurrentPage(1); 
      setExpandedRows({}); 
    });
  };

  const handleSeasonChange = (seasonId: string | null) => {
    startTransition(() => {
      setSelectedSeasonId(seasonId);
      setSelectedDate(null); 
      setCurrentPage(1); 
      setExpandedRows({}); 
    });
  };

  const formatDateDisplay = (dateKey: string) => {
    const date = new Date(dateKey + "T00:00:00");
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
        {isFetching && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Atualizando...</span>
          </div>
        )}
        {isLoading || !filteredData ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-16 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredData.dates && filteredData.dates.length > 0 ? (
          <div className="space-y-4">
            {/* Filtro por data */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-2 scrollbar-hide">
              {filteredData.dates.map((dateKey) => (
                <Button
                  size="sm"
                  key={dateKey}
                  onClick={() => handleDateChange(dateKey)}
                  className={` rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                    currentDate === dateKey
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {formatDateDisplay(dateKey)}
                </Button>
              ))}
              </div>
              {seasonConfigs && seasonConfigs.length > 0 && (
                <Select
                  value={selectedSeasonId || "current"}
                  onValueChange={(value) => handleSeasonChange(value)}
                >
                  <SelectTrigger className="sm:w-[250px] w-full">
                    <SelectValue placeholder="Temporada Atual" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasonConfigs.length > 0 && (
                      <SelectItem value="current">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Temporada Atual</span>
                        </div>
                      </SelectItem>
                    )}
                    {seasonConfigs
                      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                      .map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(new Date(config.scheduledAt), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Lista de jogadores */}
            {sortedData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Nenhum dado para a data selecionada
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {paginatedData.map((player, index) => {
                    const globalRank = (currentPage - 1) * pageSize + index + 1;
                    const rowId = `${player.playerTag}-${currentDate}`;
                    const isExpanded = expandedRows[rowId];
                    const netChange = player.gain + player.loss;
                    const isPositive = netChange > 0;
                    const isTop3 = globalRank <= 3;

                    return (
                      <div
                        key={rowId}
                        className={`rounded-lg transition-all ${
                          isTop3
                            ? "bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/30 shadow-sm"
                            : "hover:bg-muted/50 border border-transparent hover:border-border"
                        }`}
                      >
                        <div
                          className="flex items-center gap-2.5 p-2.5 sm:p-3 cursor-pointer"
                          onClick={() =>
                            setExpandedRows((v) => ({ ...v, [rowId]: !v[rowId] }))
                          }
                        >
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm flex-shrink-0 shadow-sm ${
                              isTop3
                                ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {globalRank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm text-foreground block mb-0.5">
                              {player.playerName}
                            </span>
                            <div className="flex items-center gap-3 text-xs sm:text-sm">
                            
                                <div className="flex items-center gap-1 text-green-500">
                                  <Plus className="w-3 h-3" />
                                  <span className="font-medium">
                                    {player.gain} ({player.gainCount})
                                  </span>
                                </div>
                            
                           
                                <div className="flex items-center gap-1 text-red-500">
                                  <Minus className="w-3 h-3" />
                                  <span className="font-medium">
                                    {player.loss} ({player.lossCount})
                                  </span>
                                </div>
                              
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className={`text-xs font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
                              {isPositive ? "+" : ""}{netChange}
                            </div>
                            <div className="flex items-center gap-1">
                              <Trophy className="w-4 h-4 text-amber-500" />
                              <span className="text-sm font-medium text-foreground">
                                {player.final.toLocaleString()}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground ml-2" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground ml-2" />
                            )}
                          </div>
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (() => {
                          const attacks = player.logs.filter(log => log.type === "ATTACK");
                          const defenses = player.logs.filter(log => log.type === "DEFENSE");
                          const maxCount = Math.max(attacks.length, defenses.length);
                          
                          return (
                            <div className="px-3 pb-3 pt-0 border-t border-border/50 mt-2">
                              <div className="grid grid-cols-2 gap-3 mb-3 pt-3">
                                <div className="flex items-center gap-2">
                                  <Plus className="w-4 h-4 text-green-500" />
                                  <h4 className="text-sm font-semibold text-foreground">
                                    Ataques
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Minus className="w-4 h-4 text-red-500" />
                                  <h4 className="text-sm font-semibold text-foreground">
                                    Defesas
                                  </h4>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {Array.from({ length: maxCount }).map((_, i) => {
                                  const attack = attacks[i];
                                  const defense = defenses[i];
                                  
                                  return (
                                    <div key={i} className="grid grid-cols-2 gap-2">
                                      {/* Ataque */}
                                      <div className="p-2 rounded bg-muted/50">
                                        {attack ? (
                                          <div className="flex items-center gap-2 text-xs">
                                            <span className="font-semibold text-green-500">
                                              {attack.diff > 0 ? "+" : ""}{attack.diff}
                                            </span>
                                            <span className="text-muted-foreground">
                                              → {attack.trophiesResult}
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="text-center py-2 text-xs text-muted-foreground">
                                          
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Defesa */}
                                      <div className="p-2 rounded bg-muted/50">
                                        {defense ? (
                                          <div className="flex items-center gap-2 text-xs">
                                            <span className="font-semibold text-red-500">
                                              {defense.diff > 0 ? "+" : ""}{defense.diff}
                                            </span>
                                            <span className="text-muted-foreground">
                                              → {defense.trophiesResult}
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="text-center py-2 text-xs text-muted-foreground">
                                            
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
                      {Math.min(currentPage * pageSize, sortedData.length)} de{" "}
                      {sortedData.length} resultados
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Nenhum ataque disponível para este período
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

