import { ChartSpline, Shield, Trophy, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "./-data-table";
import { CWLSelector } from "./-cwl-selector";
import type { PlayerStats } from "./-types";
import { columns } from "./-columns";
import { cwlColumns } from "./-cwl-columns";

interface PerformanceSectionProps {
  players: PlayerStats[];
  cwlPlayers: PlayerStats[];
  isFetchingFull: boolean;
  currentClanMemberTags: string[];
  clanName: string;
}

export function PerformanceSection({
  players,
  cwlPlayers,
  isFetchingFull,
  currentClanMemberTags,
  clanName,
}: PerformanceSectionProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-2">
          <ChartSpline className="w-5 h-5 text-primary" />
          Performance Detalhada
        </h2>
        {isFetchingFull && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="hidden sm:inline">Carregando dados completos...</span>
            <span className="sm:hidden">Carregando...</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="normal" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
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
          <TabsTrigger value="cwl-selector" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Seleção CWL</span>
            <span className="sm:hidden">Seleção</span>
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="cwl-selector" className="space-y-3">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
            <CWLSelector
              players={players as any}
              currentClanMembers={currentClanMemberTags}
              clanName={clanName}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

