import { BarChart3, Plus, Minus, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState, startTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ClanLogsResponse } from "@/api/types";
import type { PlayerDayLog } from "./-columns";

interface LegendAttacksProps {
  legendLogs?: ClanLogsResponse;
  isLoading?: boolean;
  isFetching?: boolean;
}

export function LegendAttacks({
  legendLogs,
  isLoading,
  isFetching,
}: LegendAttacksProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Mostra todos os dados
  const filteredData = useMemo(() => {
    if (!legendLogs) {
      return legendLogs;
    }

    // Mostra todas as datas
    const filteredDates = (legendLogs.dates || []).filter((dateStr) => {
      return true;
    });

    // Filtra os dados por data
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
    }, [legendLogs]);

  // Seleciona a data atual ou a primeira disponível
  const currentDate = selectedDate || filteredData?.dates?.[0] || null;
  const currentData = useMemo(() => {
    return currentDate && filteredData?.datesData?.[currentDate] 
      ? (filteredData.datesData[currentDate] as PlayerDayLog[]) 
      : [];
  }, [currentDate, filteredData]);

  // Ordena por troféus finais (maior primeiro) e adiciona ranking
  const sortedData = useMemo(() => {
    return [...currentData].sort((a, b) => b.final - a.final);
  }, [currentData]);

  // Paginação
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleDateChange = (date: string | null) => {
    startTransition(() => {
      setSelectedDate(date);
      setCurrentPage(1); // Reset page when changing date
      setExpandedRows({}); // Reset expanded rows
    });
  };

  const formatDateDisplay = (dateKey: string) => {
    const date = new Date(dateKey + "T00:00:00");
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
            Legend League Attacks
          </h2>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 sm:p-5 relative">
        {isFetching && (
          <div className="absolute top-2 right-2 z-10">
            <Skeleton className="h-3 w-20" />
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
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filteredData.dates.map((dateKey) => (
                <button
                  key={dateKey}
                  onClick={() => handleDateChange(dateKey)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                    currentDate === dateKey
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {formatDateDisplay(dateKey)}
                </button>
              ))}
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
                        className={`rounded-lg transition-colors ${
                          isTop3
                            ? "bg-muted/50 border-l-2 border-primary"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        <div
                          className="flex items-center gap-3 p-3 cursor-pointer"
                          onClick={() =>
                            setExpandedRows((v) => ({ ...v, [rowId]: !v[rowId] }))
                          }
                        >
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded font-semibold text-sm flex-shrink-0 ${
                              isTop3
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {globalRank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm sm:text-base text-foreground block mb-0.5">
                              {player.playerName}
                            </span>
                            <div className="flex items-center gap-4 text-xs sm:text-sm">
                            
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

