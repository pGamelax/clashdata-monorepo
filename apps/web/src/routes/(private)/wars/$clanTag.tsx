import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { WarsLoading } from "./-loading";
import { handleClanErrorWithRedirect } from "@/lib/clan-error-handler";
import {
  getClanInfoQueryOptions,
  getDashboardDataQueryOptions,
  getDashboardDataQuickQueryOptions,
  getClanRankingQueryOptions,
} from "@/api";
import { ClanHeader } from "../../../components/clan-header";
import { ClanStats } from "./-clan-stats";
import { PerformanceSection } from "./-performance-section";

export const Route = createFileRoute("/(private)/wars/$clanTag")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      error: (search.error as string) || undefined,
    };
  },
  loader: async ({ context: { queryClient }, params }) => {
    try {
      // Carrega apenas os dados rápidos inicialmente
      await queryClient.ensureQueryData(getClanInfoQueryOptions(params.clanTag));
      await queryClient.ensureQueryData(getDashboardDataQuickQueryOptions(params.clanTag));
      
      // Prefetch do ranking para obter membros atuais (não bloqueia)
      queryClient.prefetchQuery(getClanRankingQueryOptions(params.clanTag)).catch(() => {
        // Ignora erros
      });
      
      // Inicia busca completa em background (não bloqueia)
      queryClient.prefetchQuery(getDashboardDataQueryOptions(params.clanTag)).catch(() => {
        // Ignora erros na busca em background
      });
    } catch (error: unknown) {
      handleClanErrorWithRedirect(error, params.clanTag);
    }
  },
  pendingComponent: () => <WarsLoading />,

  component: RouteComponent,
});

function RouteComponent() {
  const { clanTag } = Route.useParams();

  const { data: clanStats } = useSuspenseQuery(getClanInfoQueryOptions(clanTag));
  
  // Dados rápidos (carregados imediatamente)
  const { data: quickData } = useSuspenseQuery(getDashboardDataQuickQueryOptions(clanTag));
  
  // Dados completos (carregando em background)
  const { data: fullData, isFetching: isFetchingFull } = useQuery({
    ...getDashboardDataQueryOptions(clanTag),
    // Usa os dados rápidos enquanto carrega
    placeholderData: quickData,
  });

  // Ranking do clã para obter membros atuais
  const { data: clanRanking } = useQuery(getClanRankingQueryOptions(clanTag));

  // Usa dados completos se disponíveis, senão usa os rápidos
  const clanWars = useMemo(() => {
    const data = fullData || quickData || { players: [], cwlPlayers: [] };
    // Converte DashboardPlayer para PlayerStats (adiciona opponent opcional nas defesas)
    return {
      players: data.players.map((p) => ({
        ...p,
        allDefenses: p.allDefenses.map((d) => ({ ...d, opponent: "" })),
      })),
      cwlPlayers: (data.cwlPlayers || []).map((p) => ({
        ...p,
        allDefenses: p.allDefenses.map((d) => ({ ...d, opponent: "" })),
      })),
    };
  }, [fullData, quickData]);

  // Lista de tags dos membros atuais do clã
  const currentClanMemberTags = useMemo(() => {
    return clanRanking?.players?.map((p) => p.playerTag) || [];
  }, [clanRanking]);

  useEffect(() => {
    document.title = `${clanStats.name} - Wars | Clashdata`;
  }, [clanStats.name]);

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        <ClanHeader
          clanName={clanStats.name}
          clanTag={clanTag}
          description={clanStats.description}
          compact={true}
        />

        <ClanStats
          warWins={clanStats.warWins}
          warLosses={clanStats.warLosses}
        />

        <PerformanceSection
          players={clanWars.players}
          cwlPlayers={clanWars.cwlPlayers}
          isFetchingFull={isFetchingFull}
          currentClanMemberTags={currentClanMemberTags}
          clanName={clanStats.name}
        />
      </div>
    </div>
  );
}
