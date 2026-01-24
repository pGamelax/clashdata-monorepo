import { apiFetch } from "@/lib/api";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { BarChart3, Shield } from "lucide-react";
import { columns } from "./-columns";
import { DataTable } from "./-data-table";
import { LegendLogsLoading } from "./-loading";
import { handleClanErrorWithRedirect } from "@/lib/clan-error-handler";

const pushQueryOptions = (clanTag: string) =>
  queryOptions({
    queryKey: ["push", clanTag],
    queryFn: () => {
      const cleanTag = clanTag.replace(/#|%23/g, "").trim();
      return apiFetch(
        `${import.meta.env.VITE_API_URL}/legend-logs/clan?clanTag=${cleanTag}`,
      );
    },
  });

export const Route = createFileRoute("/(private)/push/$clanTag")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      error: (search.error as string) || undefined,
    };
  },
  loader: async ({ context: { queryClient }, params }) => {
    try {
      await queryClient.ensureQueryData(pushQueryOptions(params.clanTag));
    } catch (error: unknown) {
      handleClanErrorWithRedirect(error, params.clanTag);
    }
  },
  component: RouteComponent,
  pendingComponent: LegendLogsLoading,
});

function RouteComponent() {
  const { clanTag } = Route.useParams();
  const { data: legendLogs } = useSuspenseQuery(
    pushQueryOptions(clanTag),
  );

  useEffect(() => {
    document.title = `${legendLogs.clanName} - Push | Clashdata`;
  }, [legendLogs.clanName]);

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
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground truncate">
                      {legendLogs.clanName}
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-1">
                      #{clanTag.replace("%23", "")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </header>

        {/* Logs Table */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Legend League Attacks
          </h2>

          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
            <DataTable columns={columns} data={legendLogs.players} />
          </div>
        </div>
      </div>
    </div>
  );
}
