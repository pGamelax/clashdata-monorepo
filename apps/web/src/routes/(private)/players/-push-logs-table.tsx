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
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { LegendLog } from "../push/-types";

// Função para obter a chave de data considerando horário de São Paulo
// O dia termina às 2:00 da manhã (horário de São Paulo)
function getDateKeyForSaoPaulo(timestamp: string): string {
  const date = parseISO(timestamp);
  
  // Converter para horário de São Paulo usando Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === "year")?.value || "";
  const month = parts.find(p => p.type === "month")?.value || "";
  const day = parts.find(p => p.type === "day")?.value || "";
  const hour = parseInt(parts.find(p => p.type === "hour")?.value || "0", 10);
  
  // Se a hora for antes das 2:00, considerar como parte do dia anterior
  let dateKey = `${year}-${month}-${day}`;
  if (hour < 2) {
    // Subtrair um dia da data
    const dateObj = new Date(`${year}-${month}-${day}T00:00:00`);
    dateObj.setDate(dateObj.getDate() - 1);
    const prevYear = dateObj.getFullYear();
    const prevMonth = String(dateObj.getMonth() + 1).padStart(2, "0");
    const prevDay = String(dateObj.getDate()).padStart(2, "0");
    dateKey = `${prevYear}-${prevMonth}-${prevDay}`;
  }
  
  return dateKey;
}

interface PushLogsResponse {
  logs: LegendLog[];
  total: number;
  limit: number;
  offset: number;
}

interface DayLog {
  date: string;
  gain: number;
  gainCount: number;
  loss: number;
  lossCount: number;
  final: number; // Troféus finais após o último log do dia
  logs: LegendLog[];
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

const columns: ColumnDef<DayLog>[] = [
  {
    accessorKey: "date",
    header: "DATA",
    cell: ({ row }) => {
      const date = parseISO(row.original.date);
      return (
        <span className="font-medium">
          {format(date, "dd/MM/yyyy", { locale: ptBR })}
        </span>
      );
    },
  },
  {
    accessorKey: "gain",
    header: "GAIN",
    cell: ({ row }) => {
      const gain = row.original.gain;
      const count = row.original.gainCount;
      return (
        <span className="font-semibold text-green-500">
          {formatWithSuperscript(gain, count)}
        </span>
      );
    },
  },
  {
    accessorKey: "loss",
    header: "LOSS",
    cell: ({ row }) => {
      const loss = row.original.loss;
      const count = row.original.lossCount;
      return (
        <span className="font-semibold text-red-500">
          {formatWithSuperscript(loss, count)}
        </span>
      );
    },
  },
  {
    accessorKey: "total",
    header: "FINAL",
    cell: ({ row }) => {
      const final = row.original.final;
      return (
        <span className="font-semibold">
          {final.toLocaleString()}
        </span>
      );
    },
  },
];

interface PushLogsTableProps {
  data: PushLogsResponse;
}

export function PushLogsTable({ data }: PushLogsTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Agrupar logs por data (considerando horário de São Paulo, dia termina às 2:00)
  const logsByDate = useMemo(() => {
    const dateMap = new Map<string, DayLog>();
    
    data.logs.forEach((log) => {
      const dateKey = getDateKeyForSaoPaulo(log.timestamp);
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          gain: 0,
          gainCount: 0,
          loss: 0,
          lossCount: 0,
          final: 0,
          logs: [],
        });
      }
      
      const dayLog = dateMap.get(dateKey)!;
      dayLog.logs.push(log);
      
      const trophyChange = log.diff;
      
      if (log.type === "ATTACK") {
        if (trophyChange > 0) {
          dayLog.gain += trophyChange;
          dayLog.gainCount++;
        } else if (trophyChange < 0) {
          dayLog.loss += Math.abs(trophyChange);
          dayLog.lossCount++;
        }
      } else if (log.type === "DEFENSE") {
        if (trophyChange < 0) {
          dayLog.loss += Math.abs(trophyChange);
          dayLog.lossCount++;
        } else if (trophyChange > 0) {
          dayLog.gain += trophyChange;
          dayLog.gainCount++;
        }
      }
    });
    
    // Calcular o final (troféus após o último log do dia) para cada dia
    dateMap.forEach((dayLog) => {
      if (dayLog.logs.length > 0) {
        // Ordenar logs por timestamp (mais recente primeiro)
        const sortedLogs = [...dayLog.logs].sort(
          (a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()
        );
        // Pegar o trophiesResult do último log (mais recente)
        dayLog.final = sortedLogs[0].trophiesResult;
      }
    });
    
    // Ordenar datas (mais recente primeiro)
    const sortedDates = Array.from(dateMap.values()).sort((a, b) => 
      b.date.localeCompare(a.date)
    );
    
    return sortedDates;
  }, [data.logs]);

  // Filtrar dados
  const filteredData = useMemo(() => {
    if (!globalFilter) return logsByDate;
    const filter = globalFilter.toLowerCase();
    return logsByDate.filter((dayLog) => {
      const dateStr = format(parseISO(dayLog.date), "dd/MM/yyyy", { locale: ptBR });
      return dateStr.toLowerCase().includes(filter);
    });
  }, [logsByDate, globalFilter]);

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

  return (
    <div className="space-y-4 w-full max-w-[100vw] overflow-hidden px-1 sm:px-0">
      {/* Busca */}
      <div className="flex flex-col gap-4 px-2 lg:flex-row lg:justify-between lg:items-center">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por data..."
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
                          Logs do Dia ({row.original.logs.length})
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
                  <div className="font-medium">
                    {format(parseISO(row.original.date), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-semibold text-green-500">
                    {formatWithSuperscript(row.original.gain, row.original.gainCount)}
                  </div>
                  <div className="text-sm font-semibold text-red-500">
                    {formatWithSuperscript(row.original.loss, row.original.lossCount)}
                  </div>
                  <div className="text-sm font-semibold">
                    {row.original.final.toLocaleString()}
                  </div>
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
                  Logs ({row.original.logs.length})
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

