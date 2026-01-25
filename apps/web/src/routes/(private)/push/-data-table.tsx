import React, { useState, useMemo, startTransition } from "react";
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
import { Search, ChevronDown, ChevronUp, Plus, Minus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PlayerDayLog } from "./-columns";
import type { ClanLogsResponse } from "@/api/types";

interface DataTableProps {
  columns: ColumnDef<PlayerDayLog>[];
  data: ClanLogsResponse;
}

export function DataTable({ columns, data }: DataTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Usa dados já processados do backend
  const dates = useMemo(() => data.dates || [], [data.dates]);
  const datesData = useMemo(() => data.datesData || {}, [data.datesData]);
  const currentDate = selectedDate || dates[0] || null;
  const currentData = useMemo(() => {
    return currentDate ? datesData[currentDate] || [] : [];
  }, [currentDate, datesData]);

  // Filtrar dados
  const filteredData = useMemo(() => {
    if (!globalFilter) return currentData;
    const filter = globalFilter.toLowerCase();
    return currentData.filter((player) => {
      return (
        player.playerName.toLowerCase().includes(filter) ||
        player.playerTag.toLowerCase().includes(filter)
      );
    });
  }, [currentData, globalFilter]);

  const handleDateChange = (date: string | null) => {
    startTransition(() => {
      setSelectedDate(date);
    });
  };

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
    const date = new Date(dateKey + "T00:00:00");
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  if (dates.length === 0 || currentData.length === 0) {
    return (
      <div className="space-y-4 w-full max-w-[100vw] overflow-hidden px-1 sm:px-0">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground">
            {dates.length === 0
              ? "Nenhum dado disponível."
              : "Nenhum dado para a data selecionada."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-[100vw] overflow-hidden px-1 sm:px-0">

     
      {/* Tabs para datas */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {dates.map((dateKey) => (
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
                {expandedRows[row.id] && (() => {
                  const attacks = row.original.logs.filter(log => log.type === "ATTACK");
                  const defenses = row.original.logs.filter(log => log.type === "DEFENSE");
                  const maxCount = Math.max(attacks.length, defenses.length);
                  
                  return (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1} className="p-0">
                        <div className="bg-muted/30 p-4">
                          <div className="grid grid-cols-2 gap-4 mb-3">
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
                                <div key={i} className="grid grid-cols-2 gap-3">
                                  {/* Ataque */}
                                  <div className="p-2 rounded bg-card/50">
                                    {attack ? (
                                      <div className="flex items-center justify-between text-xs">
                                     
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-green-500">
                                            {attack.diff > 0 ? "+" : ""}{attack.diff}
                                          </span>
                                          <span className="text-muted-foreground">
                                            → {attack.trophiesResult}
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-2">
                                       
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Defesa */}
                                  <div className="p-2 rounded bg-card/50">
                                    {defense ? (
                                      <div className="flex items-center justify-between text-xs">
                                       
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-red-500">
                                            {defense.diff > 0 ? "+" : ""}{defense.diff}
                                          </span>
                                          <span className="text-muted-foreground">
                                            → {defense.trophiesResult}
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-2">
                                       
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredData.map((player) => {
          const rowId = `${player.playerTag}-${currentDate}`;
          const isExpanded = expandedRows[rowId];
          return (
            <div
              key={rowId}
              className="bg-card border border-border rounded-xl p-4 space-y-3"
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() =>
                  setExpandedRows((v) => ({
                    ...v,
                    [rowId]: !v[rowId],
                  }))
                }
              >
                <div className="flex-1">
                  <Link
                    to="/players/$playerTag"
                    params={{ playerTag: player.playerTag.replace("#", "") }}
                    search={{ error: undefined }}
                    className="font-semibold text-base hover:text-primary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {player.playerName}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-sm font-semibold text-green-500">
                      <Plus className="w-3 h-3" />
                      {player.gain > 0 ? `${player.gain} (${player.gainCount})` : "0"}
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-red-500">
                      <Minus className="w-3 h-3" />
                      {player.loss > 0 ? `${player.loss} (${player.lossCount})` : "0"}
                    </div>
                    <div className="text-sm font-semibold ml-auto">
                      Final: {player.final.toLocaleString()}
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              {isExpanded && (() => {
                const attacks = player.logs.filter(log => log.type === "ATTACK");
                const defenses = player.logs.filter(log => log.type === "DEFENSE");
                const maxCount = Math.max(attacks.length, defenses.length);
                
                return (
                  <div className="pt-3 border-t border-border">
                    <div className="grid grid-cols-2 gap-3 mb-3">
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
                                <div className="flex flex-col gap-1 text-xs">
                                 
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-green-500">
                                      {attack.diff > 0 ? "+" : ""}{attack.diff}
                                    </span>
                                    <span className="text-muted-foreground">
                                      → {attack.trophiesResult}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-2">
                                
                                </div>
                              )}
                            </div>
                            
                            {/* Defesa */}
                            <div className="p-2 rounded bg-muted/50">
                              {defense ? (
                                <div className="flex flex-col gap-1 text-xs">
                                
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-red-500">
                                      {defense.diff > 0 ? "+" : ""}{defense.diff}
                                    </span>
                                    <span className="text-muted-foreground">
                                      → {defense.trophiesResult}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-2">
                                  
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
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            filteredData.length,
          )}{" "}
          de {filteredData.length} resultados
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <div className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
