"use client";

import React, { useState } from "react";
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bomb, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { columns, type ClanWar, type WarAttack } from "./-columns";
import type { RawWarItem, WarHistorySectionProps } from "./-types";

export function WarHistorySection({ rawData, playerClanTag }: WarHistorySectionProps) {
  const formatWarData = (items: RawWarItem[]): ClanWar[] => {
    return items.map((item) => {
      const clanTag = item.war_data.clan.tag;
      const opponentTag = item.war_data.opponent.tag;
      
      // Determina se o jogador fazia parte do clan ou do opponent
      // Compara a tag do clan com a tag do jogador para determinar o lado
      const playerWasInClan = clanTag ? clanTag === playerClanTag : false;
      const playerWasInOpponent = opponentTag ? opponentTag === playerClanTag : false;
      
      // Se não encontrou correspondência pelo clan tag, assume que o jogador estava no clan
      // (já que a API geralmente retorna o histórico do ponto de vista do jogador)
      const isPlayerInClan = playerWasInClan || (!playerWasInOpponent && !playerWasInClan);
      
      // Define qual é o clan do jogador e qual é o oponente
      const myClan = isPlayerInClan ? item.war_data.clan : item.war_data.opponent;
      const enemyClan = isPlayerInClan ? item.war_data.opponent : item.war_data.clan;
      
      const myClanStars = myClan.stars;
      const opponentStars = enemyClan.stars;
      const dateRaw = item.war_data.endTime;

      const playerStars =
        item.attacks?.reduce(
          (acc: number, att: WarAttack) => acc + att.stars,
          0,
        ) || 0;
      const playerDestruction = item.attacks?.[0]?.destructionPercentage || 0;

      // Obtém o nome e tag do clan inimigo
      const enemyClanName = enemyClan.name || item.war_data.opponent.name;
      const enemyClanTag = (enemyClan as { tag?: string }).tag || opponentTag;

      return {
        id: item.war_data.endTime + enemyClanTag,
        clanName: enemyClanName,
        opponentName: enemyClanName,
        result: myClanStars > opponentStars ? "Vitória" : myClanStars < opponentStars ? "Derrota" : "Empate",
        stars: playerStars,
        destruction: Number(playerDestruction.toFixed(0)),
        date: `${dateRaw.substring(6, 8)}/${dateRaw.substring(4, 6)}/${dateRaw.substring(0, 4)}`,
        rawAttacks: item.attacks || [],
        type: item.war_data.type,
      };
    });
  };

  const allData = formatWarData(rawData.items);
  const normalWars = allData.filter((w) => w.type === "random");
  const specialWars = allData.filter((w) => w.type !== "random");

  return (
    <div className="w-full space-y-4">
      <Tabs defaultValue="normal" className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
              Histórico de Batalhas
            </h2>
          <TabsList className="bg-muted border border-border rounded-lg p-1">
            <TabsTrigger 
              value="normal" 
              className="rounded-md px-4 py-1.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Normais
            </TabsTrigger>
            <TabsTrigger 
              value="special" 
              className="rounded-md px-4 py-1.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Ligas / Especiais
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="normal" className="mt-0">
          <DataTable columns={columns} data={normalWars} />
        </TabsContent>
        <TabsContent value="special" className="mt-0">
          <DataTable columns={columns} data={specialWars} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
}

function DataTable<TData extends ClanWar>({
  columns,
  data,
}: DataTableProps<TData>) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 5 },
    },
  });

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {/* Cards instead of table */}
      <div className="space-y-3">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
              {/* War Card */}
              <div
                    onClick={() => toggleRow(row.id)}
                className="bg-card border border-border rounded-xl p-4 sm:p-5 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  {/* Left Side - Clan Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        row.original.result === "Vitória" 
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                          : row.original.result === "Derrota"
                          ? "bg-red-500/10 text-red-600 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      }`}>
                        {row.original.result}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">{row.original.date}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      vs {row.original.clanName}
                    </h3>
                  </div>
                  
                  {/* Right Side - Stats */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg border border-border">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span className="font-semibold text-sm text-foreground">{row.original.stars}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg border border-border">
                      <Bomb className="w-4 h-4 fill-green-500 text-green-500" />
                      <span className="font-semibold text-sm text-foreground">{row.original.destruction}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Attacks */}
                  {expandedRows[row.id] && (
                <div className="ml-4 sm:ml-6 mt-2 space-y-2">
                          {row.original.rawAttacks.length > 0 ? (
                            row.original.rawAttacks.map((att, idx) => (
                              <div
                                key={idx}
                        className="bg-muted/30 border border-border rounded-lg p-3 sm:p-4"
                              >
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-semibold text-sm text-primary border border-primary/20">
                                  {idx + 1}º
                                </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-lg border border-border">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span className="font-semibold text-sm text-foreground">{att.stars}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-lg border border-border">
                              <Bomb className="w-3.5 h-3.5 fill-green-500 text-green-500" />
                              <span className="font-semibold text-sm text-foreground">{att.destructionPercentage}%</span>
                            </div>
                                </div>
                                </div>
                              </div>
                            ))
                          ) : (
                    <div className="bg-muted/30 border border-border rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                              Nenhum ataque registrado.
                            </p>
                        </div>
                  )}
                </div>
                  )}
                </React.Fragment>
              ))
            ) : (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground">
                  Nenhuma guerra registrada.
            </p>
          </div>
            )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <p className="text-sm text-muted-foreground">
          Página <span className="font-medium text-foreground">{table.getState().pagination.pageIndex + 1}</span> de{" "}
          <span className="font-medium text-foreground">{table.getPageCount()}</span>
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
