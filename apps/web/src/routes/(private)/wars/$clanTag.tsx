import { apiFetch } from "@/lib/api";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChartSpline, Sword, Swords, TrendingUp, Trophy } from "lucide-react";
import { columns } from "./-columns";
import { DataTable } from "./-data-table";
import { useEffect } from "react";
import { WarsLoading } from "./-loading";
import { handleClanErrorWithRedirect } from "@/lib/clan-error-handler";

const clanStatsQueryOptions = (clanTag: string) =>
  queryOptions({
    queryKey: ["clan-stats", clanTag],
    queryFn: () => {
      const cleanTag = clanTag.replace(/#|%23/g, "").trim();
      return apiFetch(
        `${import.meta.env.VITE_API_URL}/clans/clan-info?clanTag=${cleanTag}`,
      );
    },
  });

const clanWarsQueryOptions = (clanTag: string) =>
  queryOptions({
    queryKey: ["clan-wars", clanTag],
    queryFn: () => {
      const cleanTag = clanTag.replace(/#|%23/g, "").trim();
      return apiFetch(
        `${import.meta.env.VITE_API_URL}/dashboard/data?clanTag=${cleanTag}`,
      );
    },
  });

export const Route = createFileRoute("/(private)/wars/$clanTag")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      error: (search.error as string) || undefined,
    };
  },
  loader: async ({ context: { queryClient }, params }) => {
    try {
      await queryClient.ensureQueryData(clanStatsQueryOptions(params.clanTag));
      await queryClient.ensureQueryData(clanWarsQueryOptions(params.clanTag));
    } catch (error: unknown) {
      handleClanErrorWithRedirect(error, params.clanTag);
    }
  },
  pendingComponent: () => <WarsLoading />,

  component: RouteComponent,
});

function RouteComponent() {
  const { clanTag } = Route.useParams();

  const { data: clanStats } = useSuspenseQuery(clanStatsQueryOptions(clanTag));
  const { data: clanWars } = useSuspenseQuery(clanWarsQueryOptions(clanTag));

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

        {/* Performance Section */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-2">
            <ChartSpline className="w-5 h-5 text-primary" />
              Performance Detalhada
            </h2>

          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
            <DataTable columns={columns} data={clanWars.players} />
          </div>
        </div>
      </div>
    </div>
  );
}
