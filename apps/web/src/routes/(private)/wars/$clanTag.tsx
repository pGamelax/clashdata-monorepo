import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChartSpline, Sword, Swords, TrendingUp, Trophy, Shield, Loader2 } from "lucide-react";
import { columns } from "./-columns";
import { cwlColumns } from "./-cwl-columns";
import { DataTable } from "./-data-table";
import { useEffect, useMemo } from "react";
import { WarsLoading } from "./-loading";
import { handleClanErrorWithRedirect } from "@/lib/clan-error-handler";
import {
  getClanInfoQueryOptions,
  getDashboardDataQueryOptions,
  getDashboardDataQuickQueryOptions,
} from "@/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const stats = [
    {
      label: "Vitórias",
      value: clanStats.warWins,
      icon: Trophy,
      color: "text-amber-500",
    },
    {
      label: "Derrotas",
      value: clanStats.warLosses,
      icon: Sword,
      color: "text-rose-500",
    },
    {
      label: "Total de Guerras",
      value: clanStats.warWins + (clanStats.warLosses || 0),
      icon: Swords,
      color: "text-indigo-500",
    },
    {
      label: "Taxa de Vitória",
      value:
        clanStats.warWins + clanStats.warLosses > 0
          ? `${((clanStats.warWins / (clanStats.warWins + clanStats.warLosses)) * 100).toFixed(1)}%`
          : "0%",
      icon: TrendingUp,
      color: "text-emerald-500",
    },
  ];

  useEffect(() => {
    document.title = `${clanStats.name} - Wars | Clashdata`;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* Header Card */}
        <header className="bg-card border border-border rounded-xl p-5 sm:p-6 lg:p-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start sm:items-end gap-4 sm:gap-5 flex-wrap">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground flex-1 min-w-0">
                <span className="truncate block">{clanStats.name}</span>
            </h1>
              <p className="text-xs sm:text-sm text-muted-foreground bg-muted rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 border border-border font-mono whitespace-nowrap font-medium">
                #{clanTag.replace("%23", "")}
              </p>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl line-clamp-2 sm:line-clamp-none">
              {clanStats.description}
            </p>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-4 sm:p-5"
              >
                <div className={`mb-3 ${stat.color}`}>
                  <Icon size={20} className="sm:w-6 sm:h-6" />
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
                  {stat.label}
                </p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                    {stat.value}
                  </p>
              </div>
            );
          })}
        </div>

        {/* Performance Section with Tabs */}
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
            <TabsList className="grid w-full grid-cols-2 mb-4">
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

            <TabsContent value="normal" className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Estatísticas das últimas 50 guerras normais do clã
              </p>
              <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
                <DataTable columns={columns} data={clanWars.players} />
              </div>
            </TabsContent>

            <TabsContent value="cwl" className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Estatísticas de todas as guerras da Liga de Clãs
              </p>
              <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
                {clanWars.cwlPlayers && clanWars.cwlPlayers.length > 0 ? (
                  <DataTable columns={cwlColumns} data={clanWars.cwlPlayers} />
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
        </div>
      </div>
    </div>
  );
}
