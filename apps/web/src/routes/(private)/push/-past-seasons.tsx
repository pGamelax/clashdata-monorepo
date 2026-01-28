import { Calendar, ChevronLeft, ChevronRight, Trophy, Copy } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getSeasonsByClanQueryOptions, getLogsBySeasonQueryOptions } from "@/api/queries/seasons";

interface PastSeasonsProps {
  clanTag: string;
  clanName?: string;
}

export function PastSeasons({ clanTag, clanName }: PastSeasonsProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const { data: seasons } = useQuery({
    ...getSeasonsByClanQueryOptions(clanTag),
  });

  const { data: seasonLogs, } = useQuery({
    ...getLogsBySeasonQueryOptions(selectedSeasonId || "", clanTag),
    enabled: !!selectedSeasonId && !!seasons && seasons.length > 0,
  });

  // Seleciona a primeira season automaticamente
  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeasonId) {
      setSelectedSeasonId(seasons[0].seasonId);
    }
  }, [seasons, selectedSeasonId]);

  // Reset página quando mudar de temporada
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSeasonId]);

  const paginatedPlayers = useMemo(() => {
    if (!seasonLogs || seasonLogs.players.length === 0) return [];
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return seasonLogs.players.slice(start, end);
  }, [seasonLogs, currentPage]);

  const totalPages = seasonLogs ? Math.ceil(seasonLogs.players.length / pageSize) : 0;

  const shareableText = useMemo(() => {
    if (!seasonLogs || seasonLogs.players.length === 0 || !selectedSeasonId) return "";
    
    const clanTitle = clanName || "Clã";
    const selectedSeason = seasons?.find(s => s.seasonId === selectedSeasonId);
    const seasonName = selectedSeason?.seasonId || selectedSeasonId;
    
    let text = `🏆 TEMPORADAS PASSADAS - ${clanTitle}\n\n`;
    text += `📅 Temporada: ${seasonName}\n\n`;
    text += `📊 Ranking de Troféus:\n\n`;
    
    // Ordena por troféus (maior para menor)
    const sortedPlayers = [...seasonLogs.players].sort((a, b) => b.trophies - a.trophies);
    
    sortedPlayers.forEach((player, index) => {
      const rank = index + 1;
      text += `${rank}. ${player.playerName}\n`;
      text += `   ${player.playerTag}\n`;
      text += `   🏆 ${player.trophies.toLocaleString()} troféus\n`;
      text += `\n`;
    });
    
    text += `\n📈 Estatísticas Gerais:\n`;
    text += `   • Total de Jogadores: ${sortedPlayers.length}\n`;
    const avgTrophies = sortedPlayers.reduce((sum, p) => sum + p.trophies, 0) / sortedPlayers.length;
    const maxTrophies = Math.max(...sortedPlayers.map(p => p.trophies));
    const minTrophies = Math.min(...sortedPlayers.map(p => p.trophies));
    text += `   • Média de Troféus: ${avgTrophies.toFixed(0)}\n`;
    text += `   • Maior Pontuação: ${maxTrophies.toLocaleString()}\n`;
    text += `   • Menor Pontuação: ${minTrophies.toLocaleString()}\n`;
    
    return text;
  }, [seasonLogs, selectedSeasonId, seasons, clanName]);

  const copyToClipboard = useCallback(() => {
    if (shareableText) {
      navigator.clipboard.writeText(shareableText);
    }
  }, [shareableText]);

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
    <div >
      <div className="flex items-center justify-between flex-wrap gap-3">
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
                    {season.seasonId}
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
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Temporadas Passadas</h2>
          {seasonLogs && seasonLogs.players.length > 0 && selectedSeasonId && (
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Copiar Ranking</span>
              <span className="sm:hidden">Copiar</span>
            </Button>
          )}
        </div>
        {seasonLogs && seasonLogs.players.length > 0 ? (
          <>
            <div className="space-y-1.5 mt-2">
              {paginatedPlayers.map((player, index) => {
                const localRank = (currentPage - 1) * pageSize + index + 1;
                const isTop3 = localRank <= 3;
                return (
                  <div
                    key={player.id}
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
                      <span className="font-medium text-sm text-foreground block mb-0.5">
                        {player.playerName}
                      </span>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-foreground">
                          {player.trophies.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
                  {Math.min(currentPage * pageSize, seasonLogs.players.length)} de{" "}
                  {seasonLogs.players.length} jogadores
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
          </>
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

