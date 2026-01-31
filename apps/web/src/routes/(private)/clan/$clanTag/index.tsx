import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  getClanInfoQueryOptions,
  getNormalWarsQueryOptions,
  getClanRankingQueryOptions,
} from "@/api";
import { 
  Users, 
  Trophy, 
  MapPin, 
  Shield, 
  Crown, 
  Globe,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CWLSelector } from "../-cwl-selector";

// Função para obter o mês atual (formato YYYY-MM)
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export const Route = createFileRoute("/(private)/clan/$clanTag/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { clanTag } = Route.useParams();
  const { data: clanStats } = useSuspenseQuery(getClanInfoQueryOptions(clanTag));
  const [isCWLSelectorOpen, setIsCWLSelectorOpen] = useState(false);
  const currentMonth = getCurrentMonth();

  // Busca dados de guerras normais para o CWL Selector
  const { data: normalWarsData } = useQuery({
    ...getNormalWarsQueryOptions(clanTag, [currentMonth]),
    enabled: isCWLSelectorOpen, // Só busca quando o dialog está aberto
  });

  // Ranking do clã para obter membros atuais
  const { data: clanRanking } = useQuery({
    ...getClanRankingQueryOptions(clanTag),
    enabled: isCWLSelectorOpen, // Só busca quando o dialog está aberto
  });

  // Lista de tags dos membros atuais do clã
  const currentClanMemberTags = useMemo(() => {
    return clanRanking?.players?.map((p: any) => p.playerTag) || [];
  }, [clanRanking]);

  // Processa os dados dos jogadores para o CWL Selector
  const cwlPlayers = useMemo(() => {
    if (!normalWarsData?.players) return [];
    return normalWarsData.players;
  }, [normalWarsData]);

  useEffect(() => {
    document.title = `${clanStats.name} - Clashdata`;
  }, [clanStats.name]);

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Visão Geral
            </h2>
            <Button
              onClick={() => setIsCWLSelectorOpen(true)}
              variant="default"
              size="sm"
              className="rounded-xl"
            >
              <Shield className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Seleção CWL</span>
              <span className="sm:hidden">CWL</span>
            </Button>
          </div>

            {/* Informações Básicas do Clã */}
            <div className="space-y-4">
              <h3 className="text-sm sm:text-base font-medium text-muted-foreground uppercase tracking-wide">
                Informações do Clã
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {clanStats.clanLevel && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Nível</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">
                      {clanStats.clanLevel}
                    </p>
                  </div>
                )}
                {clanStats.members !== undefined && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Membros
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">
                      {clanStats.members}/50
                    </p>
                  </div>
                )}
                {clanStats.clanPoints && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Pontos
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">
                      {clanStats.clanPoints.toLocaleString("pt-BR")}
                    </p>
                  </div>
                )}
                {clanStats.clanCapitalPoints && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Capital
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-foreground">
                      {clanStats.clanCapitalPoints.toLocaleString("pt-BR")}
                    </p>
                  </div>
                )}
                {clanStats.location && (
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Localização
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-foreground">
                      {clanStats.location.name}
                      {clanStats.location.countryCode && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({clanStats.location.countryCode})
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {clanStats.type && (
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Tipo
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-foreground capitalize">
                      {clanStats.type === "inviteOnly" ? "Convite Apenas" : 
                       clanStats.type === "open" ? "Aberto" : 
                       clanStats.type === "closed" ? "Fechado" : clanStats.type}
                    </p>
                  </div>
                )}
                {clanStats.requiredTrophies !== undefined && (
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <p className="text-xs font-medium text-muted-foreground">Troféus Mínimos</p>
                    <p className="text-sm sm:text-base font-semibold text-foreground">
                      {clanStats.requiredTrophies.toLocaleString("pt-BR")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Estatísticas de Guerra */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm sm:text-base font-medium text-muted-foreground uppercase tracking-wide">
                Estatísticas de Guerra
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Vitórias</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-500">
                    {clanStats.warWins}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Derrotas</p>
                  <p className="text-lg sm:text-xl font-bold text-rose-500">
                    {clanStats.warLosses}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Empates</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {clanStats.warTies || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Total</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {clanStats.totalWars}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Taxa de Vitória</p>
                  <p className="text-lg sm:text-xl font-bold text-emerald-500">
                    {clanStats.totalWars > 0
                      ? `${((clanStats.warWins / clanStats.totalWars) * 100).toFixed(1)}%`
                      : "0%"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Sequência</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {clanStats.warWinStreak !== undefined ? `${clanStats.warWinStreak} vitórias` : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Liga e Configurações */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm sm:text-base font-medium text-muted-foreground uppercase tracking-wide">
                Liga e Configurações
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clanStats.warLeague && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Liga de Guerra
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-foreground">
                      {clanStats.warLeague.name}
                    </p>
                  </div>
                )}
                {clanStats.capitalLeague && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Liga do Capital
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-foreground">
                      {clanStats.capitalLeague.name}
                    </p>
                  </div>
                )}
                {clanStats.warFrequency && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Frequência de Guerra</p>
                    <p className="text-sm sm:text-base font-semibold text-foreground capitalize">
                      {clanStats.warFrequency === "always" ? "Sempre" :
                       clanStats.warFrequency === "moreThanOncePerWeek" ? "Mais de 1x/semana" :
                       clanStats.warFrequency === "oncePerWeek" ? "1x por semana" :
                       clanStats.warFrequency === "lessThanOncePerWeek" ? "Menos de 1x/semana" :
                       clanStats.warFrequency === "never" ? "Nunca" : clanStats.warFrequency}
                    </p>
                  </div>
                )}
                {clanStats.isWarLogPublic !== undefined && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Histórico de Guerra</p>
                    <p className="text-sm sm:text-base font-semibold text-foreground">
                      {clanStats.isWarLogPublic ? "Público" : "Privado"}
                    </p>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>

      <Dialog open={isCWLSelectorOpen} onOpenChange={setIsCWLSelectorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seleção CWL - Liga de Clãs</DialogTitle>
          </DialogHeader>
          <CWLSelector
            players={cwlPlayers as any}
            currentClanMembers={currentClanMemberTags}
            clanName={clanStats.name}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
