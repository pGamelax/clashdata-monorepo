import { apiFetch, ApiError } from "@/lib/api";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Flame,
  Star,
  Sword,
  Trophy,
  BarChart3,
} from "lucide-react";
import type { PlayerInfo, PlayerLabel } from "./-types";
import { WarHistorySection } from "./-data-table";
import { PushLogsTable } from "./-push-logs-table";
import { useEffect } from "react";

const playerInfoQueryOptions = (playerTag: string) =>
  queryOptions({
    queryKey: ["player-info", playerTag],
    queryFn: async () => {
      const cleanTag = playerTag.replace(/#|%23/g, "").trim();
      const response = await apiFetch(
        `${import.meta.env.VITE_API_URL}/players/info?playerTag=${cleanTag}`,
      );
      return response as PlayerInfo;
    },
  });

const playerWarHistoryQueryOptions = (playerTag: string) =>
  queryOptions({
    queryKey: ["player-war-history", playerTag],
    queryFn: async () => {
      const cleanTag = playerTag.replace(/#|%23/g, "").trim();
      return apiFetch(
        `${import.meta.env.VITE_API_URL}/players/war-history?playerTag=${cleanTag}`,
      );
    },
  });

const playerPushLogsQueryOptions = (playerTag: string) =>
  queryOptions({
    queryKey: ["player-push-logs", playerTag],
    queryFn: async () => {
      const cleanTag = playerTag.replace(/#|%23/g, "").trim();
      return apiFetch(
        `${import.meta.env.VITE_API_URL}/legend-logs/player?playerTag=${cleanTag}`,
      );
    },
  });

export const Route = createFileRoute("/(private)/players/$playerTag")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      error: (search.error as string) || undefined,
    };
  },
  loader: async ({ context: { queryClient }, params }) => {
    try {
      await Promise.all([
        queryClient.ensureQueryData(playerInfoQueryOptions(params.playerTag)),
        queryClient.ensureQueryData(
          playerWarHistoryQueryOptions(params.playerTag),
        ),
        queryClient.ensureQueryData(
          playerPushLogsQueryOptions(params.playerTag),
        ),
      ]);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        // 403: Tag não pertence ao usuário - redireciona para /players com mensagem
        if (error.status === 403) {
          throw redirect({
            to: "/players",
            search: {
              error: "Acesso negado. Este jogador não pertence ao seu usuário.",
            },
          });
        }
        // 401: Não autorizado - redireciona para login
        if (error.status === 401) {
          throw redirect({
            to: "/sign-in",
            search: {
              error: "Sua sessão expirou. Faça login novamente.",
            },
          });
        }
        // 404: Jogador não encontrado - redireciona para /players com mensagem
        if (error.status === 404) {
          throw redirect({
            to: "/players",
            search: {
              error: "Jogador não encontrado. Verifique a tag fornecida.",
            },
          });
        }
        // 400: Tag inválida - redireciona para /players com mensagem
        if (error.status === 400) {
          throw redirect({
            to: "/players",
            search: {
              error: error.message || "Tag inválida. Verifique o formato da tag.",
            },
          });
        }
      }

      throw error;
    }
  },
  pendingComponent: () => (
    <div className="min-h-screen grow p-4 lg:p-8 bg-background animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-48 w-full bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border/50 shadow-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-card/80 backdrop-blur-sm rounded-2xl border-2 border-border/50 shadow-lg"
            />
          ))}
        </div>
      </div>
    </div>
  ),
  component: RouteComponent,
});

function RouteComponent() {
  const { playerTag } = Route.useParams();
  const { data: playerInfo } = useSuspenseQuery(
    playerInfoQueryOptions(playerTag),
  );

  const { data: playerWarHistory } = useSuspenseQuery(
    playerWarHistoryQueryOptions(playerTag),
  );

  const { data: playerPushLogs } = useSuspenseQuery(
    playerPushLogsQueryOptions(playerTag),
  );


  const quickStats = [
    {
      label: "Troféus Atuais",
      value: playerInfo.trophies,
      icon: Trophy,
      color: "text-amber-500",
    },
    {
      label: "Recorde Histórico",
      value: playerInfo.bestTrophies,
      icon: Star,
      color: "text-blue-500",
    },
    {
      label: "Estrelas de Guerra",
      value: playerInfo.warStars,
      icon: Sword,
      color: "text-red-500",
    },
    {
      label: "Nível de EXP",
      value: playerInfo.expLevel,
      icon: Flame,
      color: "text-orange-500",
    },
  ];

  useEffect(() => {
    document.title = `${playerInfo.name} - Player | Clashdata`;
  }, []);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="grow">
        <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
          {/* Header Card */}
          <header className="bg-card border border-border rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
            <div className="space-y-4 sm:space-y-5">
              {/* Player Info */}
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="relative flex-shrink-0">
                  {playerInfo.leagueTier?.iconUrls?.large && (
                    <img
                      src={playerInfo.leagueTier.iconUrls.large}
                      alt="League"
                      className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain"
                    />
                  )}
                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-lg">
                    TH {playerInfo.townHallLevel}
                  </span>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground truncate">
                      {playerInfo.name}
                    </h1>
                    <p className="text-muted-foreground font-mono text-xs sm:text-sm mt-0.5 truncate">
                      {playerInfo.tag}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {playerInfo.clan && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-lg border border-border">
                        <img
                          src={playerInfo.clan.badgeUrls.small}
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          alt="Clan"
                        />
                        <span className="font-medium text-xs sm:text-sm text-foreground truncate max-w-[200px] sm:max-w-none">
                          {playerInfo.clan.name}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground uppercase tracking-wide px-2.5 py-1 bg-muted rounded-lg font-medium">
                      {playerInfo.role}
                    </span>
                  </div>
                </div>
              </div>
              {/* Labels */}
              {playerInfo.labels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {playerInfo.labels.map((label: PlayerLabel) => (
                    <div
                      key={label.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-lg border border-border"
                    >
                      <img
                        src={label.iconUrls.small}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                        alt={label.name}
                      />
                      <span className="text-xs font-medium uppercase tracking-tight">
                        {label.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickStats.map((stat, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-4 sm:p-5"
              >
                <div className={`mb-3 ${stat.color}`}>
                  <stat.icon size={20} className="sm:w-6 sm:h-6" />
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
                  {stat.label}
                </p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* War History Section */}
          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
              Desempenho em Guerras
            </h2>
            <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
              <WarHistorySection 
                rawData={playerWarHistory} 
                playerClanTag={playerInfo.clan?.tag}
              />
            </div>
          </section>

          {/* Push Logs Section */}
          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Legend League Logs
            </h2>
            <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
              {playerPushLogs && playerPushLogs.logs && playerPushLogs.logs.length > 0 ? (
                <PushLogsTable data={playerPushLogs} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <BarChart3 className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-base font-medium text-foreground mb-1">
                    Nenhum log encontrado
                  </p>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Este jogador ainda não possui logs de Legend League registrados.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
