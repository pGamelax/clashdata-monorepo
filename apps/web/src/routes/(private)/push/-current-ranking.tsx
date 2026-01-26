import { Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClanRankingResponse } from "@/api/types";

interface CurrentRankingProps {
  ranking?: ClanRankingResponse;
  isFetching?: boolean;
}

export function CurrentRanking({ ranking, isFetching }: CurrentRankingProps) {
  if (!ranking || ranking.players.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        Ranking Atual
      </h2>
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5 relative">
        {isFetching && (
          <div className="absolute top-2 right-2 z-10">
            <Skeleton className="h-3 w-20" />
          </div>
        )}
        <div className="space-y-2">
          {ranking.players.slice(0, 15).map((player) => {
            const isTop3 = player.rank <= 3;
            const isLegend = player.leagueTier?.name === "Legend League";
            return (
              <Link
                key={player.playerTag}
                to="/players/$playerTag"
                params={{ playerTag: player.playerTag.replace("#", "") }}
                search={{ error: undefined }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isTop3
                    ? "bg-muted/50 border-l-2 border-primary"
                    : "hover:bg-muted/30"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded font-semibold text-sm flex-shrink-0 ${
                    isTop3
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {player.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm sm:text-base text-foreground truncate">
                      {player.playerName}
                    </span>
                    {isLegend && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        LEGEND
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {player.leagueTier?.iconUrls?.small && (
                      <img
                        src={player.leagueTier.iconUrls.small}
                        alt={player.leagueTier.name}
                        className="w-4 h-4 flex-shrink-0"
                      />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {player.trophies.toLocaleString()}
                    </span>
                    {player.bestTrophies > player.trophies && (
                      <span className="text-xs text-muted-foreground">
                        (Melhor: {player.bestTrophies.toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

