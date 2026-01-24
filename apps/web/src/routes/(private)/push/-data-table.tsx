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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { LegendLog, LegendLogPlayer } from "./-types";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PlayerDayLog } from "./-columns";

interface DataTableProps {
  columns: ColumnDef<PlayerDayLog>[];
  data: LegendLogPlayer[];
}

// Função para formatar número com superscript
const formatWithSuperscript = (value: number, count: number): string => {
  const sign = value >= 0 ? "+" : "";
  const superscript = count.toString();
  const superscriptMap: Record<string, string> = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", 
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹"
  };
  const superscriptStr = superscript.split("").map(d => superscriptMap[d] || d).join("");
  return `${sign}${Math.abs(value)}${superscriptStr}`;
};

export function DataTable({ columns, data }: DataTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Agrupar logs por data
  const logsByDate = useMemo(() => {
    const dateMap = new Map<string, LegendLog[]>();
    
    data.forEach((player) => {
      player.logs.forEach((log) => {
        const dateKey = format(parseISO(log.timestamp), "yyyy-MM-dd");
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, []);
        }
        dateMap.get(dateKey)!.push(log);
      });
    });

    // Ordenar datas (mais recente primeiro)
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => b.localeCompare(a));
    
    // Processar cada data para criar PlayerDayLog
    const result = new Map<string, PlayerDayLog[]>();
    
    sortedDates.forEach((dateKey) => {
      const logs = dateMap.get(dateKey)!;
      const playerMap = new Map<string, PlayerDayLog>();
      
      // Processar todos os logs para calcular ganhos e perdas
      logs.forEach((log) => {
        if (!playerMap.has(log.playerTag)) {
          const player = data.find(p => p.playerTag === log.playerTag);
          if (!player) return;
          
          playerMap.set(log.playerTag, {
            playerTag: log.playerTag,
            playerName: log.playerName,
            gain: 0,
            gainCount: 0,
            loss: 0,
            lossCount: 0,
            final: 0, 
            logs: [],
          });
        }
        
        const playerLog = playerMap.get(log.playerTag)!;
        playerLog.logs.push(log);
        
        // GAIN e LOSS: usar diff (mudança de troféus), não trophiesResult (total de troféus)
        // diff positivo = ganhou troféus, diff negativo = perdeu troféus
        const trophyChange = log.diff;
        
        if (log.type === "ATTACK") {
          // ATAQUE: soma os diffs positivos para GAIN
          if (trophyChange > 0) {
            playerLog.gain += trophyChange;
            playerLog.gainCount++;
          } else if (trophyChange < 0) {
            // Ataque que perdeu troféus vai para LOSS
            playerLog.loss += Math.abs(trophyChange);
            playerLog.lossCount++;
          }
        } else if (log.type === "DEFENSE") {
          // DEFESA: soma os diffs negativos (valor absoluto) para LOSS
          if (trophyChange < 0) {
            playerLog.loss += Math.abs(trophyChange);
            playerLog.lossCount++;
          } else if (trophyChange > 0) {
            // Defesa que ganhou troféus vai para GAIN (raro mas possível)
            playerLog.gain += trophyChange;
            playerLog.gainCount++;
          }
        }
      });
      
      // Converter para array
      const playerLogs = Array.from(playerMap.values());
      
      // Ordenar logs de cada jogador por timestamp
      playerLogs.forEach(playerLog => {
        playerLog.logs.sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
      });
      
      // Calcular FINAL: usar troféus atuais do jogador como base
      // O FINAL representa os troféus após todos os logs do dia
      playerLogs.forEach((playerLog) => {
        const player = data.find(p => p.playerTag === playerLog.playerTag);
        if (player) {
          playerLog.final = player.trophies;
        }
      });
      
      // Ordenar por troféus finais (maior primeiro)
      playerLogs.sort((a, b) => b.final - a.final);
      
      result.set(dateKey, playerLogs);
    });
    
    return { dates: sortedDates, data: result };
  }, [data]);

  // Definir primeira data como selecionada se não houver seleção
  const currentDate = selectedDate || logsByDate.dates[0] || null;
  const currentData = currentDate ? logsByDate.data.get(currentDate) || [] : [];

  // Filtrar dados
  const filteredData = useMemo(() => {
    if (!globalFilter) return currentData;
    const filter = globalFilter.toLowerCase();
    return currentData.filter(
      (player) =>
        player.playerName.toLowerCase().includes(filter) ||
        player.playerTag.toLowerCase().includes(filter)
    );
  }, [currentData, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const formatDateDisplay = (dateKey: string) => {
    const date = parseISO(dateKey);
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-4 w-full max-w-[100vw] overflow-hidden px-1 sm:px-0">
      {/* Tabs para datas */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {logsByDate.dates.map((dateKey) => (
          <button
            key={dateKey}
            onClick={() => setSelectedDate(dateKey)}
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

      {/* Busca */}
      <div className="flex flex-col gap-4 px-2 lg:flex-row lg:justify-between lg:items-center">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar jogador..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 h-11 rounded-lg border border-border bg-card focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50 border-b border-border">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-none hover:bg-transparent">
                <TableHead className="uppercase py-4 pl-6 text-xs font-semibold tracking-wide text-muted-foreground w-12"></TableHead>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="uppercase py-4 text-xs font-semibold tracking-wide text-muted-foreground"
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
                  className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border group"
                  onClick={() =>
                    setExpandedRows((v) => ({ ...v, [row.id]: !v[row.id] }))
                  }
                >
                  <TableCell className="py-4 pl-6">
                    {expandedRows[row.id] ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-4"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {expandedRows[row.id] && row.original.logs.length > 0 && (
                  <TableRow className="bg-muted/20 border-none">
                    <TableCell colSpan={columns.length + 1} className="p-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground mb-4">
                          Ataques do Dia ({row.original.logs.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {row.original.logs
                            .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime())
                            .map((log) => {
                              const isPositive = log.diff >= 0;
                              return (
                                <div
                                  key={log.id}
                                  className="bg-card border border-border rounded-lg p-4 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium uppercase text-muted-foreground">
                                      {log.type === "ATTACK" ? "Ataque" : "Defesa"}
                                    </span>
                                    <span
                                      className={`text-sm font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}
                                    >
                                      {isPositive ? `+${log.diff}` : log.diff}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span>Mudança:</span>
                                      <span className="font-medium">{log.diff}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span>Total após:</span>
                                      <span className="font-medium">{log.trophiesResult}</span>
                                    </div>
                                    <div className="pt-1 border-t border-border">
                                      <span>{format(parseISO(log.timestamp), "dd/MM/yyyy", { locale: ptBR })}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="flex flex-col gap-3 md:hidden px-2">
        {table.getRowModel().rows.map((row) => (
          <div
            key={row.id}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            <div
              className="p-4 space-y-3 cursor-pointer"
              onClick={() =>
                setExpandedRows((v) => ({ ...v, [row.id]: !v[row.id] }))
              }
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link
                    to="/players/$playerTag"
                    params={{ playerTag: row.original.playerTag.replace("#", "") }}
                    search={{ error: undefined }}
                    className="font-medium hover:text-primary transition-colors cursor-pointer block"
                  >
                    {row.original.playerName}
                  </Link>
                  <div className="text-xs text-muted-foreground font-mono">{row.original.playerTag}</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-semibold text-green-500">
                    {formatWithSuperscript(row.original.gain, row.original.gainCount)}
                  </div>
                  <div className="text-sm font-semibold text-red-500">
                    {formatWithSuperscript(row.original.loss, row.original.lossCount)}
                  </div>
                  <div className="text-sm font-semibold">{row.original.final.toLocaleString()}</div>
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

            {expandedRows[row.id] && row.original.logs.length > 0 && (
              <div className="p-4 bg-muted/20 border-t border-border space-y-3">
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Ataques ({row.original.logs.length})
                </h4>
                {row.original.logs
                  .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime())
                  .map((log) => {
                    const isPositive = log.diff >= 0;
                    return (
                      <div
                        key={log.id}
                        className="bg-card border border-border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium uppercase text-muted-foreground">
                            {log.type === "ATTACK" ? "Ataque" : "Defesa"}
                          </span>
                          <span
                            className={`text-sm font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}
                          >
                            {isPositive ? `+${log.diff}` : log.diff}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center justify-between">
                            <span>Mudança:</span>
                            <span className="font-medium">{log.diff}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Total após:</span>
                            <span className="font-medium">{log.trophiesResult}</span>
                          </div>
                          <div className="pt-1 border-t border-border">
                            <span>{format(parseISO(log.timestamp), "dd/MM/yyyy", { locale: ptBR })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Paginação */}
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

