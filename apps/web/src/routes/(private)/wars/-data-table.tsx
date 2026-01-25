import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Percent,
  Search,
  Star,
  ChevronDown,
  ChevronUp,
  History,
  Sword,
  X
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO } from "date-fns";
import { DatePickerWithRange } from "@/components/data-picker";
import type { PlayerStats, WarAction, ProcessedPlayer } from "./-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTableProps {
  columns: ColumnDef<ProcessedPlayer>[];
  data: PlayerStats[];
}

export function DataTable({ columns, data }: DataTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [date, setDate] = useState<DateRange | undefined>();
  const [selectedSeasons, setSelectedSeasons] = useState<number>(4); // Últimas 4 temporadas por padrão
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const { dynamicData } = useMemo(() => {
    const K = 8;
    const GLOBAL_AVG = 2.0;

    if (!Array.isArray(data)) return { dynamicData: [], warCount: 0 };

    const allDates = new Set<string>();
    data.forEach((p) => {
      p.allAttacks?.forEach((a) => allDates.add(a.date));
      p.allDefenses?.forEach((d) => allDates.add(d.date));
    });

    const sortedDates = Array.from(allDates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );

    // Calcula data de X temporadas atrás (baseado no selectedSeasons)
    // Se tem filtro de data customizado, não usa filtro de temporada
    let limitedDates: Set<string>;
    let seasonsAgoDate: Date | null = null;
    
    if (date?.from && date?.to) {
      // Se tem filtro de data customizado, usa todas as datas (o filtro será aplicado depois)
      limitedDates = new Set(sortedDates);
    } else {
      // Usa o selectedSeasons (padrão é 4 temporadas)
      const seasonsToUse = selectedSeasons > 0 ? selectedSeasons : 4;
      seasonsAgoDate = new Date();
      seasonsAgoDate.setMonth(seasonsAgoDate.getMonth() - seasonsToUse);
      seasonsAgoDate.setHours(0, 0, 0, 0); // Normaliza para início do dia
      
      // Filtra datas pelas últimas X temporadas
      const filteredDatesBySeason = sortedDates.filter((dateStr) => {
        try {
          const dateObj = parseISO(dateStr);
          if (isNaN(dateObj.getTime())) return false;
          const dateObjNormalized = new Date(dateObj);
          dateObjNormalized.setHours(0, 0, 0, 0);
          return dateObjNormalized >= seasonsAgoDate!;
        } catch {
          return false;
        }
      });
      limitedDates = new Set(filteredDatesBySeason);
    }

    const totalClanWarDates = new Set<string>();

    const processed: ProcessedPlayer[] = data
      .map((player) => {
        const playerUniqueWars = new Set<string>();
        const totalPts = new Set<string>();
        const filterFn = (action: WarAction) => {
          try {
            const actionDate = parseISO(action.date);
            
            // Valida se a data é válida
            if (isNaN(actionDate.getTime())) {
              return false;
            }
            
            // Se tem filtro de data customizado, usa ele (e ignora filtro de temporada)
            if (date?.from && date?.to) {
              return isWithinInterval(actionDate, {
                start: date.from,
                end: date.to,
              });
            }
            
            // Caso contrário, usa filtro de temporada
            // Se temos uma data limite de temporada, compara diretamente
            if (seasonsAgoDate) {
              const actionDateNormalized = new Date(actionDate);
              actionDateNormalized.setHours(0, 0, 0, 0);
              return actionDateNormalized >= seasonsAgoDate;
            }
            
            // Se não há data limite (filtro de data customizado), verifica se está no conjunto
            return limitedDates.has(action.date);
          } catch {
            return false;
          }
        };

        const attacks = (player.allAttacks || []).filter(filterFn);
        const defenses = (player.allDefenses || []).filter(filterFn);

        attacks.forEach((att) => {
          if (att.stars === 3) {
            totalPts.add(crypto.randomUUID());
          }
          playerUniqueWars.add(att.date);
          totalClanWarDates.add(att.date);
        });
        defenses.forEach((def) => {
          playerUniqueWars.add(def.date);
          totalClanWarDates.add(def.date);
        });

        const attackCount = attacks.length;
        const playerWarCount = playerUniqueWars.size;
        const totalStars = attacks.reduce((acc, cur) => acc + cur.stars, 0);
        const totalDestr = attacks.reduce(
          (acc, cur) => acc + cur.destruction,
          0,
        );

        const performanceScore =
          (K * GLOBAL_AVG + totalStars) / (K + attackCount);

        const defenseCount = defenses.length;
        const totalDefStars = defenses.reduce((acc, cur) => acc + cur.stars, 0);
        const totalDefDestr = defenses.reduce(
          (acc, cur) => acc + cur.destruction,
          0,
        );
        return {
          ...player,
          totalPts: totalPts.size,
          attackCount,
          warCount: playerWarCount,
          performanceScore,
          attacksPerWar:
            playerWarCount > 0
              ? (attackCount / playerWarCount).toFixed(2)
              : "0.00",
          avgStars:
            attackCount > 0 ? (totalStars / attackCount).toFixed(2) : "0.00",
          avgDestruction:
            attackCount > 0 ? (totalDestr / attackCount).toFixed(0) : "0",
          avgDefenseStars:
            defenseCount > 0
              ? (totalDefStars / defenseCount).toFixed(2)
              : "0.00",
          avgDefenseDestruction:
            defenseCount > 0 ? (totalDefDestr / defenseCount).toFixed(0) : "0",
          displayAttacks: attacks,
          displayDefenses: defenses,
        };
      })
      .filter((p) => p.warCount > 0)
      .sort((a, b) => b.performanceScore - a.performanceScore);

    return { dynamicData: processed, warCount: totalClanWarDates.size };
  }, [data, date, selectedSeasons]);

  const table = useReactTable({
    data: dynamicData,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4 w-full max-w-[100vw] overflow-hidden px-1 sm:px-0">
      <div className="flex flex-col gap-4 px-2 lg:flex-row lg:justify-between lg:items-center">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar jogador..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 h-11 rounded-xl border-2 border-border/50 bg-muted/30 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
            />
          </div>

          <div className="w-full md:w-64">
            <DatePickerWithRange 
              date={date} 
              setDate={(newDate) => {
                setDate(newDate);
                // Remove filtro de temporada quando usa filtro de data
                if (newDate?.from && newDate?.to) {
                  setSelectedSeasons(0);
                } else if (!newDate) {
                  // Se removeu o filtro de data, volta para 4 temporadas
                  setSelectedSeasons(4);
                }
              }} 
            />
          </div>

          <div className="relative w-full md:w-64">
            <History className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Select
              value={String(selectedSeasons)}
              onValueChange={(value) => {
                const seasons = Number(value);
                setSelectedSeasons(seasons);
                // Remove filtro de data quando usa filtro de temporada
                if (seasons > 0) {
                  setDate(undefined);
                }
              }}
              disabled={!!date}
            >
              <SelectTrigger className="w-full h-11 pl-10 pr-3 rounded-xl border-2 border-border/50 bg-muted/30 backdrop-blur-sm focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-all disabled:opacity-50">
                <SelectValue placeholder="Temporada" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 border-border/50 bg-card/95 backdrop-blur-xl shadow-xl">
                <SelectItem value="1">Última temporada</SelectItem>
                <SelectItem value="2">Últimas 2 temporadas</SelectItem>
                <SelectItem value="3">Últimas 3 temporadas</SelectItem>
                <SelectItem value="4">Últimas 4 temporadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botão para limpar filtros */}
          {(globalFilter || date || selectedSeasons !== 4) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGlobalFilter("");
                setDate(undefined);
                setSelectedSeasons(4);
              }}
              className="h-11 px-3 sm:px-4 rounded-xl border-2 border-border/50 bg-muted/30 backdrop-blur-sm hover:bg-muted/50 transition-all"
            >
              <X className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Limpar filtros</span>
              <span className="sm:hidden">Limpar</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:hidden px-2">
        {table.getRowModel().rows.map((row) => (
          <div
            key={row.id}
            className="rounded-xl border-2 border-border/50 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all overflow-hidden"
          >
            <div
              className="p-4 space-y-4 cursor-pointer"
              onClick={() =>
                setExpandedRows((v) => ({ ...v, [row.id]: !v[row.id] }))
              }
            >
              <div className="flex justify-between items-start">
                {flexRender(
                  row.getVisibleCells()[1].column.columnDef.cell,
                  row.getVisibleCells()[1].getContext(),
                )}
                <div className="text-right">
                  {flexRender(
                    row.getVisibleCells()[2].column.columnDef.cell,
                    row.getVisibleCells()[2].getContext(),
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t-2 border-border/50">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm font-semibold">
                    Media de ataque
                  </p>
                  {flexRender(
                    row.getVisibleCells()[3].column.columnDef.cell,
                    row.getVisibleCells()[3].getContext(),
                  )}
                </div>
                <div className="space-y-1 ">
                  <p className="text-muted-foreground text-sm font-semibold">
                    Participacao
                  </p>
                  {flexRender(
                    row.getVisibleCells()[5].column.columnDef.cell,
                    row.getVisibleCells()[5].getContext(),
                  )}
                </div>
              </div>
              <div className="flex justify-center pt-1">
                {expandedRows[row.id] ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {expandedRows[row.id] && (() => {
              return (
                <div className="p-4 bg-muted/20 border-t-2 border-border/50">
                  {/* Cabeçalho */}
                  <div className="flex items-center gap-2 mb-4">
                    <Sword className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-semibold text-foreground">
                      Ataques Feitos
                    </h4>
                  </div>

                  {/* Apenas Ataques */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {row.original.displayAttacks.map((att, i) => (
                      <div key={i} className="p-3 sm:p-4 rounded-xl bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-md hover:shadow-lg transition-all min-w-0 overflow-hidden">
                        <div className="flex justify-between items-center mb-2 gap-2">
                          <span className="text-xs sm:text-sm font-bold uppercase text-muted-foreground truncate">
                            Ataque {i + 1}
                          </span>
                          <div className="flex flex-row items-center gap-1.5 flex-shrink-0">
                            <div
                              className={`flex items-center gap-1 ${att.destruction < 50 ? "bg-destructive/10" : att.destruction < 80 && att.destruction > 51 ? "bg-amber-600/10" : "bg-primary/10"} px-1.5 py-0.5 rounded-full ${att.destruction < 50 ? "text-destructive" : att.destruction < 80 && att.destruction > 51 ? "text-amber-600" : "text-primary"}`}
                            >
                              <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">
                                {att.destruction}%
                              </span>
                            </div>
                            <div
                              className={`flex items-center gap-1 ${att.stars == 3 ? "bg-primary/10" : att.stars == 2 ? "bg-amber-600/10" : "bg-destructive/10"} px-1.5 py-0.5 rounded-full ${att.stars == 3 ? "text-primary" : att.stars == 2 ? "text-amber-600" : "text-destructive"}`}
                            >
                              <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">{att.stars}</span>
                              <Star size={8} className="fill-current flex-shrink-0" />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="font-bold text-xs sm:text-sm truncate">
                            {att.opponent}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {new Date(parseISO(att.date)).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      <div className="hidden md:block rounded-xl border-2 border-border/50 bg-card/80 backdrop-blur-sm shadow-xl overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30 backdrop-blur-sm border-b-2 border-border/50">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-none hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="uppercase py-4 first:pl-6 last:pr-6 text-xs font-black tracking-widest text-muted-foreground"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                <TableRow
                  className="cursor-pointer hover:bg-muted/20 transition-colors border-b border-border/30 group"
                  onClick={() =>
                    setExpandedRows((v) => ({ ...v, [row.id]: !v[row.id] }))
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-4 first:pl-6 last:pr-6 group-hover:text-foreground transition-colors"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {expandedRows[row.id] && (() => {
                  return (
                    <TableRow className="bg-muted/10 border-none">
                      <TableCell colSpan={columns.length} className="p-6">
                        {/* Cabeçalho */}
                        <div className="flex items-center gap-2 mb-4">
                          <Sword className="w-5 h-5 text-primary" />
                          <h4 className="text-base font-semibold text-foreground">
                            Ataques Feitos
                          </h4>
                        </div>

                        {/* Apenas Ataques */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3">
                          {row.original.displayAttacks.map((att, i) => (
                            <div key={i} className="p-3 lg:p-4 rounded-xl bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-md hover:shadow-lg transition-all min-w-0 overflow-hidden">
                              <div className="flex justify-between items-center mb-2 gap-2">
                                <span className="text-xs sm:text-sm font-bold uppercase text-muted-foreground truncate">
                                  Ataque {i + 1}
                                </span>
                                <div className="flex flex-row items-center gap-1.5 flex-shrink-0">
                                  <div
                                    className={`flex items-center gap-1 ${att.destruction < 50 ? "bg-destructive/10" : att.destruction < 80 && att.destruction > 51 ? "bg-amber-600/10" : "bg-primary/10"} px-1.5 py-0.5 rounded-full ${att.destruction < 50 ? "text-destructive" : att.destruction < 80 && att.destruction > 51 ? "text-amber-600" : "text-primary"}`}
                                  >
                                    <span className="text-xs font-bold whitespace-nowrap">
                                      {att.destruction}
                                    </span>
                                    <Percent size={10} className="flex-shrink-0" />
                                  </div>
                                  <div
                                    className={`flex items-center gap-1 ${att.stars == 3 ? "bg-primary/10" : att.stars == 2 ? "bg-amber-600/10" : "bg-destructive/10"} px-1.5 py-0.5 rounded-full ${att.stars == 3 ? "text-primary" : att.stars == 2 ? "text-amber-600" : "text-destructive"}`}
                                  >
                                    <span className="text-xs font-bold whitespace-nowrap">
                                      {att.stars}
                                    </span>
                                    <Star size={10} className="fill-current flex-shrink-0" />
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 min-w-0">
                                <div className="font-bold text-xs sm:text-sm truncate">
                                  {att.opponent}
                                </div>
                                <span className="text-[10px] sm:text-xs text-muted-foreground font-normal">
                                  {new Date(parseISO(att.date)).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })()}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between flex-row w-full px-2 sm:px-0 py-4">
        <p className="text-sm text-muted-foreground font-medium">
          Página <span className="font-bold text-foreground">{table.getState().pagination.pageIndex + 1}</span> de{" "}
          <span className="font-bold text-foreground">{table.getPageCount()}</span>
        </p>
        <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
            className="rounded-xl border-2 shadow-md hover:shadow-lg transition-all"
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
            className="rounded-xl border-2 shadow-md hover:shadow-lg transition-all"
        >
          Próximo
        </Button>
        </div>
      </div>
    </div>
  );
}

