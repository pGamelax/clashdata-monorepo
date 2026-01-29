import { useState } from "react";
import { ChartSpline, Shield, Trophy, Loader2, Sword } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "./-data-table";
import { CWLSelector } from "./-cwl-selector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PlayerStats } from "./-types";
import { columns } from "./-columns";
import { cwlColumns } from "./-cwl-columns";
import { CurrentWar } from "./-current-war";
import { useQuery } from "@tanstack/react-query";
import { getCurrentWarQueryOptions } from "@/api/queries/wars";

interface PerformanceSectionProps {
  players: PlayerStats[];
  cwlPlayers: PlayerStats[];
  isFetchingFull: boolean;
  currentClanMemberTags: string[];
  clanName: string;
  clanTag: string;
}

export function PerformanceSection({
  players,
  cwlPlayers,
  isFetchingFull,
  currentClanMemberTags,
  clanName,
  clanTag,
}: PerformanceSectionProps) {
  const [isCWLSelectorOpen, setIsCWLSelectorOpen] = useState(false);

  // Busca guerra atual
  const { data: currentWar } = useQuery(getCurrentWarQueryOptions(clanTag));
  const hasCurrentWar = currentWar && (currentWar.state === "inWar" || currentWar.state === "preparation");
  
  // Define a tab padrão: se houver guerra atual, mostra ela primeiro, senão mostra normal
  const defaultTab = hasCurrentWar ? "current" : "normal";

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        {isFetchingFull && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="hidden sm:inline">Carregando dados completos...</span>
            <span className="sm:hidden">Carregando...</span>
          </div>
        )}
        <Button
          variant="outline"
          onClick={() => setIsCWLSelectorOpen(true)}
          className="gap-2"
        >
          <Trophy className="w-4 h-4" />
          <span className="hidden sm:inline">Seleção CWL</span>
          <span className="sm:hidden">CWL</span>
        </Button>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className={`grid w-full mb-4 ${hasCurrentWar ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {hasCurrentWar && (
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Sword className="w-4 h-4" />
              <span className="hidden sm:inline">Guerra Atual</span>
              <span className="sm:hidden">Atual</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="normal" className="flex items-center gap-2">
            <ChartSpline className="w-4 h-4" />
            <span className="hidden sm:inline">Guerras Normais</span>
            <span className="sm:hidden">Normais</span>
          </TabsTrigger>
          <TabsTrigger value="cwl" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Liga de Clãs (CWL)</span>
            <span className="sm:hidden">CWL</span>
          </TabsTrigger>
        </TabsList>

        {hasCurrentWar && (
          <TabsContent value="current" className="space-y-3">
            <CurrentWar war={currentWar} clanTag={clanTag} />
          </TabsContent>
        )}

        <TabsContent value="normal" className="space-y-3">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
            <DataTable columns={columns} data={players} />
          </div>
        </TabsContent>

        <TabsContent value="cwl" className="space-y-3">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
            {cwlPlayers && cwlPlayers.length > 0 ? (
              <DataTable columns={cwlColumns} data={cwlPlayers} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Shield className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-base font-medium text-foreground mb-1">
                  Nenhum dado de CWL encontrado
                </p>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Este clã ainda não possui dados de guerras da Liga de Clãs registrados.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isCWLSelectorOpen} onOpenChange={setIsCWLSelectorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seleção CWL - Liga de Clãs</DialogTitle>
          </DialogHeader>
          <CWLSelector
            players={players as any}
            currentClanMembers={currentClanMemberTags}
            clanName={clanName}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

