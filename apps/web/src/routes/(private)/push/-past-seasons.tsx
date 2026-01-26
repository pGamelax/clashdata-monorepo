import { Calendar, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getSeasonsByClanQueryOptions, getLogsBySeasonQueryOptions, type SeasonByClan } from "@/api/queries/seasons";

interface PastSeasonsProps {
  clanTag: string;
}

export function PastSeasons({ clanTag }: PastSeasonsProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(undefined);
  
  const { data: seasons, isFetching: isFetchingSeasons } = useQuery({
    ...getSeasonsByClanQueryOptions(clanTag),
  });

  const { data: seasonLogs, isFetching: isFetchingLogs } = useQuery({
    ...getLogsBySeasonQueryOptions(selectedSeasonId || "", clanTag),
    enabled: !!selectedSeasonId && !!seasons && seasons.length > 0,
  });

  // Seleciona a primeira season automaticamente
  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeasonId) {
      setSelectedSeasonId(seasons[0].seasonId);
    }
  }, [seasons, selectedSeasonId]);

  if (!seasons || seasons.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Temporadas Passadas
        </h2>
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma temporada passada disponível
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = selectedSeasonId
    ? seasons.findIndex((s) => s.seasonId === selectedSeasonId)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
              Temporadas Passadas
            </h2>
            {seasonLogs?.scheduledAt && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {new Date(seasonLogs.scheduledAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>
        {seasons.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentIndex > 0) {
                  setSelectedSeasonId(seasons[currentIndex - 1].seasonId);
                }
              }}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Select
              value={selectedSeasonId || seasons[0]?.seasonId || ""}
              onValueChange={(value) => setSelectedSeasonId(value || undefined)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione uma temporada" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.seasonId} value={season.seasonId}>
                    {season.seasonId} ({new Date(season.scheduledAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentIndex < seasons.length - 1) {
                  setSelectedSeasonId(seasons[currentIndex + 1].seasonId);
                }
              }}
              disabled={currentIndex === seasons.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5 relative">
        {(isFetchingSeasons || isFetchingLogs) && (
          <div className="absolute top-2 right-2 z-10">
            <Skeleton className="h-3 w-20" />
          </div>
        )}
        {seasonLogs && seasonLogs.players.length > 0 ? (
          <div className="space-y-2">
            {seasonLogs.players.map((player, index) => {
              const playerRank = index + 1;
              const isTop3 = playerRank <= 3;
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isTop3
                      ? "bg-muted/50 border-l-2 border-primary"
                      : ""
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded font-semibold text-sm flex-shrink-0 ${
                      isTop3
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {playerRank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm sm:text-base text-foreground block mb-0.5">
                      {player.playerName}
                    </span>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-foreground">
                        {player.trophies.toLocaleString()}
                      </span>
                      {player.rank && (
                        <span className="text-xs text-muted-foreground">
                          (Rank Global: {player.rank.toLocaleString()})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Nenhum dado de temporada disponível para este clan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

