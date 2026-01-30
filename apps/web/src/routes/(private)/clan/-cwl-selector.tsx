import React, { useMemo, useState, useCallback } from "react";
import { Copy, Download, Users, Star, TrendingUp, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProcessedPlayer } from "./-types";
import { cn } from "@/lib/utils";

interface CWLSelectorProps {
  players: ProcessedPlayer[];
  currentClanMembers: string[]; // Array de tags dos membros atuais
  clanName: string;
}

interface SelectedPlayer extends ProcessedPlayer {
  isCurrentMember: boolean;
}

// Componente memoizado para cada item da lista
const PlayerItem = React.memo(({ 
  player, 
  isSelected, 
  isDisabled, 
  onToggle 
}: { 
  player: SelectedPlayer; 
  isSelected: boolean; 
  isDisabled: boolean; 
  onToggle: () => void;
}) => {
  return (
    <div
      onClick={() => !isDisabled && onToggle()}
      className={cn(
        "flex items-center gap-3 p-3 sm:p-4 rounded-lg transition-all cursor-pointer border border-emerald-800/10",
        "hover:bg-muted/50 active:scale-[0.98]",
        player.isCurrentMember
          ? "bg-emerald-50 dark:bg-emerald-950/20"
          : "bg-card",
        isDisabled && "opacity-50 cursor-not-allowed hover:bg-card"
      )}
    >
      <div className="flex-shrink-0">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          disabled={isDisabled}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 sm:mb-2 flex-wrap">
          <span className="font-semibold text-sm sm:text-base text-foreground truncate">
            {player.name}
          </span>
          {player.isCurrentMember && (
            <Badge variant="default" className="text-xs bg-emerald-600 shrink-0 font-semibold px-2 py-0.5">
              ✓ No Clã
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
          <span className="font-mono text-[10px] sm:text-xs">{player.tag}</span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">{player.avgStars}</span>
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">{player.performanceScore.toFixed(2)}</span>
          </span>
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">{player.attackCount} ataques</span>
          </span>
        </div>
      </div>
    </div>
  );
});

PlayerItem.displayName = "PlayerItem";

export function CWLSelector({ players, currentClanMembers, clanName }: CWLSelectorProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [showShareView, setShowShareView] = useState(false);

  // Converte currentClanMembers para Set para busca O(1)
  const currentClanMembersSet = useMemo(() => {
    return new Set(currentClanMembers);
  }, [currentClanMembers]);

  // Processa jogadores apenas quando players ou currentClanMembers mudam
  const processedPlayers = useMemo(() => {
    return players.map((player: any) => {
      // Se já tem performanceScore, é ProcessedPlayer
      if (player.performanceScore !== undefined) {
        return {
          ...player,
          isCurrentMember: currentClanMembersSet.has(player.tag),
        };
      }
      
      // Caso contrário, processa como PlayerStats
      const attackCount = player.allAttacks?.length || 0;
      const totalStars = (player.allAttacks || []).reduce((acc: number, cur: any) => acc + (cur.stars || 0), 0);
      const K = 8;
      const GLOBAL_AVG = 2.0;
      const performanceScore = (K * GLOBAL_AVG + totalStars) / (K + attackCount);
      const avgStars = attackCount > 0 ? (totalStars / attackCount).toFixed(2) : "0.00";
      const totalDestr = (player.allAttacks || []).reduce((acc: number, cur: any) => acc + (cur.destruction || 0), 0);
      const avgDestruction = attackCount > 0 ? (totalDestr / attackCount).toFixed(0) : "0";
      const warCount = new Set((player.allAttacks || []).map((a: any) => a.date)).size;
      
      return {
        ...player,
        attackCount,
        performanceScore,
        avgStars,
        avgDestruction,
        warCount,
        isCurrentMember: currentClanMembersSet.has(player.tag),
      };
    }).filter((player) => player.warCount > 0) as SelectedPlayer[];
  }, [players, currentClanMembersSet]);

  // Filtra e ordena apenas quando searchTerm muda
  const availablePlayers = useMemo(() => {
    let filtered = processedPlayers;
    
    // Filtra por termo de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((player) =>
        player.name.toLowerCase().includes(search) ||
        player.tag.toLowerCase().includes(search)
      );
    }
    
    // Ordena apenas por performance score (pontos)
    return filtered.sort((a, b) => {
      return b.performanceScore - a.performanceScore;
    });
  }, [processedPlayers, searchTerm]);

  const togglePlayer = useCallback((playerTag: string) => {
    setSelectedPlayers((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(playerTag)) {
        newSelected.delete(playerTag);
      } else {
        if (newSelected.size >= 15) {
          return prev; // Limite de 15 jogadores
        }
        newSelected.add(playerTag);
      }
      return newSelected;
    });
  }, []);

  const selectedPlayersList = useMemo(() => {
    return availablePlayers.filter((p) => selectedPlayers.has(p.tag));
  }, [availablePlayers, selectedPlayers]);

  const shareableText = useMemo(() => {
    if (selectedPlayersList.length === 0) return "";
    
    const selected = [...selectedPlayersList].sort((a, b) => b.performanceScore - a.performanceScore);
    
    let text = `🏆 SELEÇÃO CWL - ${clanName}\n\n`;
    text += `📋 Lista dos 15 Jogadores Selecionados:\n\n`;
    
    selected.forEach((player, index) => {
      const status = player.isCurrentMember ? "✅ No Clã" : "⚠️ Fora do Clã";
      text += `${index + 1}. ${player.name} (${player.tag})\n`;
      text += `   ${status}\n`;
      text += `   📊 Performance: ${player.performanceScore.toFixed(2)}\n`;
      text += `   ⭐ Média de Estrelas: ${player.avgStars}\n`;
      text += `   💥 Média de Destruição: ${player.avgDestruction}%\n`;
      text += `   🗡️ Ataques: ${player.attackCount}\n`;
      text += `   🛡️ Defesas: ${player.allDefenses?.length || 0}\n`;
      text += `\n`;
    });
    
    text += `\n📈 Estatísticas Gerais:\n`;
    const avgPerformance = selected.reduce((sum, p) => sum + p.performanceScore, 0) / selected.length;
    const avgStars = selected.reduce((sum, p) => sum + parseFloat(p.avgStars), 0) / selected.length;
    const avgDestruction = selected.reduce((sum, p) => sum + parseFloat(p.avgDestruction), 0) / selected.length;
    const currentMembersCount = selected.filter((p) => p.isCurrentMember).length;
    
    text += `   • Média de Performance: ${avgPerformance.toFixed(2)}\n`;
    text += `   • Média de Estrelas: ${avgStars.toFixed(2)}\n`;
    text += `   • Média de Destruição: ${avgDestruction.toFixed(1)}%\n`;
    text += `   • Membros Atuais no Clã: ${currentMembersCount}/15\n`;
    
    return text;
  }, [selectedPlayersList, clanName]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(shareableText);
  }, [shareableText]);

  const downloadAsText = useCallback(() => {
    const blob = new Blob([shareableText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CWL-Selecao-${clanName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [shareableText, clanName]);

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                Seleção CWL - Liga de Clãs
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Selecione os 15 melhores jogadores para participar da CWL
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                {selectedPlayers.size}/15 selecionados
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Buscar jogador por nome ou tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 h-9 sm:h-10 text-sm"
            />
            <Users className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
          </div>

          {/* Players List */}
          <ScrollArea className="h-[400px] sm:h-[500px] rounded-md  4">
            <div className="space-y-2">
              {availablePlayers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground/50 mb-2 sm:mb-4" />
                  <p className="text-sm sm:text-base font-medium text-foreground mb-1">
                    Nenhum jogador encontrado
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {searchTerm ? "Tente buscar com outro termo" : "Nenhum jogador disponível"}
                  </p>
                </div>
              ) : (
                availablePlayers.map((player) => {
                  const isSelected = selectedPlayers.has(player.tag);
                  const isDisabled = !isSelected && selectedPlayers.size >= 15;

                  return (
                    <PlayerItem
                      key={player.tag}
                      player={player}
                      isSelected={isSelected}
                      isDisabled={isDisabled}
                      onToggle={() => togglePlayer(player.tag)}
                    />
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          {selectedPlayers.size > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 sm:pt-4 border-t">
              <Button
                onClick={() => setShowShareView(true)}
                className="flex-1 sm:flex-initial sm:flex-1"
                variant="default"
                size="sm"
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                <span className="text-xs sm:text-sm">Ver Lista</span>
              </Button>
              <Button 
                onClick={copyToClipboard} 
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-initial"
              >
                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                <span className="text-xs sm:text-sm">Copiar</span>
              </Button>
              <Button 
                onClick={downloadAsText} 
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-initial"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                <span className="text-xs sm:text-sm">Baixar</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share View Modal */}
      {showShareView && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={() => setShowShareView(false)}
        >
          <Card 
            className="w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">Lista Compartilhável - CWL</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowShareView(false)}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-3 sm:space-y-4">
              <div className="bg-muted p-3 sm:p-4 rounded-lg font-mono text-[10px] sm:text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto">
                {shareableText}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={copyToClipboard} className="flex-1" size="sm">
                  <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                  <span className="text-xs sm:text-sm">Copiar Texto</span>
                </Button>
                <Button onClick={downloadAsText} variant="outline" className="flex-1" size="sm">
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                  <span className="text-xs sm:text-sm">Baixar TXT</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

