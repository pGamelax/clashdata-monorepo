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
  const [warLimit, setWarLimit] = useState<number>(20);
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
    const limitedDates =
      warLimit > 0 ? new Set(sortedDates.slice(0, warLimit)) : allDates;

    const totalClanWarDates = new Set<string>();

    const processed: ProcessedPlayer[] = data
      .map((player) => {
        const playerUniqueWars = new Set<string>();
        const totalPts = new Set<string>();
        const filterFn = (action: WarAction) => {
          const actionDate = parseISO(action.date);
          const isInDateRange =
            !date?.from ||
            !date?.to ||
            isWithinInterval(actionDate, {
              start: date.from,
              end: date.to,
            });
          const isWithinRecentLimit = limitedDates.has(action.date);

          return isInDateRange && isWithinRecentLimit;
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
        };
      })
      .filter((p) => p.warCount > 0)
      .sort((a, b) => b.performanceScore - a.performanceScore);

    return { dynamicData: processed, warCount: totalClanWarDates.size };
  }, [data, date, warLimit]);

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
            <DatePickerWithRange date={date} setDate={setDate} />
          </div>

          <div className="relative w-full md:w-64">
            <History className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Select
              value={String(warLimit)}
              onValueChange={(value) => setWarLimit(Number(value))}
            >
              <SelectTrigger className="w-full h-11 pl-10 pr-3 rounded-xl border-2 border-border/50 bg-muted/30 backdrop-blur-sm focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-all">
                <SelectValue placeholder="Guerras" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 border-border/50 bg-card/95 backdrop-blur-xl shadow-xl">
                <SelectItem value="5">Últimas 5</SelectItem>
                <SelectItem value="10">Últimas 10</SelectItem>
                <SelectItem value="15">Últimas 15</SelectItem>
                <SelectItem value="20">Últimas 20</SelectItem>
                <SelectItem value="30">Últimas 30</SelectItem>
                <SelectItem value="40">Últimas 40</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

            {expandedRows[row.id] && (
              <div className="p-4 bg-muted/20 border-t-2 border-border/50 space-y-3">
                {row.original.displayAttacks.map((att, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-md hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold uppercase text-muted-foreground">
                        Ataque {i + 1}
                      </span>
                      <div className="flex flex-row items-center gap-2">
                        <div
                          className={`flex items-center gap-1 ${att.destruction < 50 ? "bg-destructive/10" : att.destruction < 80 && att.destruction > 51 ? "bg-amber-600/10" : "bg-primary/10"} px-2 py-0.5 rounded-full ${att.destruction < 50 ? "text-destructive" : att.destruction < 80 && att.destruction > 51 ? "text-amber-600" : "text-primary"}  `}
                        >
                          <span className="text-xs font-bold">
                            {att.destruction}%
                          </span>
                        </div>
                        <div
                          className={`flex items-center gap-1 ${att.stars == 3 ? "bg-primary/10" : att.stars == 2 ? "bg-amber-600/10" : "bg-destructive/10"} px-2 py-0.5 rounded-full ${att.stars == 3 ? "text-primary" : att.stars == 2 ? "text-amber-600" : "text-destructive"}`}
                        >
                          <span className="text-xs font-bold">{att.stars}</span>
                          <Star size={10} className="fill-current" />
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-sm truncate flex justify-between items-center">
                      <span className="max-w-37.5 truncate">
                        {att.opponent}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {new Date(parseISO(att.date)).toLocaleDateString(
                          "pt-BR",
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                {expandedRows[row.id] && (
                  <TableRow className="bg-muted/10 border-none">
                    <TableCell colSpan={columns.length} className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {row.original.displayAttacks.map((att, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-xl bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-md hover:shadow-lg transition-all"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-bold uppercase text-muted-foreground">
                                Ataque {i + 1}
                              </span>
                              <div className="flex flex-row items-center gap-2">
                                <div
                                  className={`flex items-center gap-1 ${att.destruction < 50 ? "bg-destructive/10" : att.destruction < 80 && att.destruction > 51 ? "bg-amber-600/10" : "bg-primary/10"} px-2 py-0.5 rounded-full ${att.destruction < 50 ? "text-destructive" : att.destruction < 80 && att.destruction > 51 ? "text-amber-600" : "text-primary"}`}
                                >
                                  <span className="text-sm font-bold">
                                    {att.destruction}
                                  </span>
                                  <Percent size={10} />
                                </div>
                                <div
                                  className={`flex items-center gap-1 ${att.stars == 3 ? "bg-primary/10" : att.stars == 2 ? "bg-amber-600/10" : "bg-destructive/10"} px-2 py-0.5 rounded-full ${att.stars == 3 ? "text-primary" : att.stars == 2 ? "text-amber-600" : "text-destructive"}`}
                                >
                                  <span className="text-sm font-bold">
                                    {att.stars}
                                  </span>
                                  <Star size={10} className="fill-current" />
                                </div>
                              </div>
                            </div>
                            <div className="font-bold text-sm truncate flex flex-row justify-between">
                              <span>{att.opponent}</span>
                              <span className="text-sm text-muted-foreground font-normal">
                                {new Date(
                                  parseISO(att.date),
                                ).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
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
