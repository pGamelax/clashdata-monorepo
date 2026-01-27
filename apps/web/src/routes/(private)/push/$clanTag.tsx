import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { LegendLogsLoading } from "./-loading";
import { handleClanErrorWithRedirect } from "@/lib/clan-error-handler";
import { getClanLogsQueryOptions, getClanRankingQueryOptions, getClanInfoQueryOptions } from "@/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, BarChart3, Calendar } from "lucide-react";
import { CurrentRanking } from "./-current-ranking";
import { LegendAttacks } from "./-legend-attacks";
import { PastSeasons } from "./-past-seasons";
import { ClanHeader } from "@/components/clan-header";

export const Route = createFileRoute("/(private)/push/$clanTag")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      error: (search.error as string) || undefined,
    };
  },
  loader: async ({ context: { queryClient }, params }) => {
    try {
      // Carrega dados essenciais primeiro
      await Promise.all([
        queryClient.ensureQueryData(getClanLogsQueryOptions(params.clanTag)),
        queryClient.ensureQueryData(getClanInfoQueryOptions(params.clanTag)),
      ]);
      // Ranking em background (não bloqueia)
      queryClient.prefetchQuery(getClanRankingQueryOptions(params.clanTag)).catch(() => {
        // Ignora erros na busca em background
      });
    } catch (error: unknown) {
      handleClanErrorWithRedirect(error, params.clanTag);
    }
  },
  component: RouteComponent,
  pendingComponent: LegendLogsLoading,
});

function RouteComponent() {
  const { clanTag } = Route.useParams();
  const { 
    data: legendLogs,
    isFetching: isFetchingLogs,
    isLoading: isLoadingLogs,
  } = useQuery(getClanLogsQueryOptions(clanTag));
  const { data: clanInfo } = useSuspenseQuery(getClanInfoQueryOptions(clanTag));
  const { data: ranking, isFetching: isFetchingRanking } = useQuery({
    ...getClanRankingQueryOptions(clanTag),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (legendLogs) {
      document.title = `${legendLogs.clanName} - Push | Clashdata`;
    }
  }, [legendLogs?.clanName]);

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        <ClanHeader
          clanName={clanInfo?.name || legendLogs?.clanName || ""}
          clanTag={clanTag}
          description={clanInfo?.description || ""}
          compact={true}
        />

        <Tabs defaultValue="attacks" className="space-y-4 w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="attacks" className="flex-shrink-0">
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Legend League Attacks</span>
              <span className="sm:hidden">Attacks</span>
            </TabsTrigger>
            <TabsTrigger value="current" className="flex-shrink-0">
              <Trophy className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Ranking Atual</span>
              <span className="sm:hidden">Atual</span>
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-shrink-0">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Temporadas Passadas</span>
              <span className="sm:hidden">Passadas</span>
            </TabsTrigger>
          </TabsList>
          

          <TabsContent value="current" className="space-y-4">
            <CurrentRanking ranking={ranking} isFetching={isFetchingRanking} />
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            <PastSeasons clanTag={clanTag} />
          </TabsContent>

          <TabsContent value="attacks" className="space-y-4">
            <LegendAttacks
              legendLogs={legendLogs}
              isLoading={isLoadingLogs}
              isFetching={isFetchingLogs}
              clanTag={clanTag}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
