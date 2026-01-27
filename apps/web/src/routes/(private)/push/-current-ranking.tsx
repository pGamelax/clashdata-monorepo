import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ClanRankingResponse } from "@/api/types";

interface CurrentRankingProps {
  ranking?: ClanRankingResponse;
  isFetching?: boolean;
}

export function CurrentRanking({ ranking }: CurrentRankingProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  if (!ranking || ranking.players.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(ranking.players.length / pageSize);
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return ranking.players.slice(start, end);
  }, [ranking.players, currentPage]);

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
        <div className="space-y-2 mt-2">
          {paginatedPlayers.map((player, index) => {
            const localRank = (currentPage - 1) * pageSize + index + 1;
            const isTop3 = localRank <= 3;
            const isLegend = player.leagueTier?.name === "Legend League";
            return (
              <Link
                key={player.playerTag}
                to="/players/$playerTag"
                params={{ playerTag: player.playerTag.replace("#", "") }}
                search={{ error: undefined }}
                className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg transition-all ${
                  isTop3
                    ? "bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/30 shadow-sm"
                    : "hover:bg-muted/50 border border-transparent hover:border-border"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm flex-shrink-0 shadow-sm ${
                    isTop3
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {localRank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-foreground truncate">
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

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
              {Math.min(currentPage * pageSize, ranking.players.length)} de{" "}
              {ranking.players.length} jogadores
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

