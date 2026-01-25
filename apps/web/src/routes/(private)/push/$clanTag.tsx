import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { BarChart3, Shield, Trophy } from "lucide-react";
import { columns } from "./-columns";
import { DataTable } from "./-data-table";
import { DataTableSkeleton } from "./-data-table-skeleton";
import { LegendLogsLoading } from "./-loading";
import { handleClanErrorWithRedirect } from "@/lib/clan-error-handler";
import { getClanLogsQueryOptions, getClanRankingQueryOptions } from "@/api";
import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export const Route = createFileRoute("/(private)/push/$clanTag")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      error: (search.error as string) || undefined,
    };
  },
  loader: async ({ context: { queryClient }, params }) => {
    try {
      // Carrega dados essenciais primeiro
      await queryClient.ensureQueryData(getClanLogsQueryOptions(params.clanTag));
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
        {/* Header Card */}
        <header className="bg-card border border-border rounded-xl p-5 sm:p-6 lg:p-8">
          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5 flex-wrap">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 border-2 border-primary/20">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {legendLogs ? (
                      <>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground truncate">
                          {legendLogs.clanName}
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-1">
                          #{clanTag.replace("%23", "")}
                        </p>
                      </>
                    ) : (
                      <>
                        <Skeleton className="h-8 sm:h-10 w-64" />
                        <Skeleton className="h-4 w-24 mt-2" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </header>

        {/* Ranking Section - Carousel */}
        {ranking && ranking.players.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Ranking Atual
              </h2>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 sm:p-5 relative">
              {isFetchingRanking && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="bg-muted/90 backdrop-blur-sm border border-border rounded-lg px-2 py-1">
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              )}
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full relative"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {ranking.players.slice(0, 10).map((player) => {
                    const isTop3 = player.rank <= 3;
                    const isLegend = player.leagueTier?.name === "Legend League";
                    return (
                      <CarouselItem
                        key={player.playerTag}
                        className="pl-2 md:pl-4 basis-auto min-w-[140px] sm:min-w-[160px] md:min-w-[180px]"
                      >
                        <Link
                          to="/players/$playerTag"
                          params={{ playerTag: player.playerTag.replace("#", "") }}
                          search={{ error: undefined }}
                          className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg hover:bg-muted/50 transition-colors border h-full ${
                            isTop3
                              ? "border-primary/20 bg-primary/5"
                              : "border-transparent hover:border-border"
                          }`}
                        >
                          <div
                            className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-sm sm:text-base ${
                              player.rank === 1
                                ? "bg-amber-500/20 text-amber-500 border-2 border-amber-500/30"
                                : player.rank === 2
                                ? "bg-slate-400/20 text-slate-400 border-2 border-slate-400/30"
                                : player.rank === 3
                                ? "bg-amber-700/20 text-amber-700 border-2 border-amber-700/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {player.rank}
                          </div>
                          <div className="w-full min-w-0 text-center space-y-2">
                            <div className="space-y-1">
                              <div className="font-semibold text-sm sm:text-base text-foreground break-words line-clamp-2">
                                {player.playerName}
                              </div>
                              {isLegend && (
                                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                  LEGEND
                                </span>
                              )}
                            </div>
                            {player.leagueTier?.iconUrls?.small && (
                              <img
                                src={player.leagueTier.iconUrls.small}
                                alt={player.leagueTier.name}
                                className="w-6 h-6 sm:w-7 sm:h-7 mx-auto"
                              />
                            )}
                            <div className="space-y-0.5">
                              <div className="text-sm sm:text-base font-bold text-foreground">
                                {player.trophies.toLocaleString()}
                              </div>
                              {player.bestTrophies > player.trophies && (
                                <div className="text-[10px] text-muted-foreground">
                                  Melhor: {player.bestTrophies.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 bg-background/80 backdrop-blur-sm border-2 border-border shadow-lg hover:bg-background hover:scale-110 transition-all" />
                <CarouselNext className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 bg-background/80 backdrop-blur-sm border-2 border-border shadow-lg hover:bg-background hover:scale-110 transition-all" />
              </Carousel>
            </div>
          </div>
        )}

        {/* Logs Table */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Legend League Attacks
          </h2>

          <div className="bg-card border border-border rounded-xl p-3 sm:p-4 lg:p-6 relative">
            {isLoadingLogs || !legendLogs ? (
              <DataTableSkeleton />
            ) : (
              <>
                {isFetchingLogs && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-muted/90 backdrop-blur-sm border border-border rounded-lg px-2 py-1">
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                )}
                <DataTable columns={columns} data={legendLogs} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
