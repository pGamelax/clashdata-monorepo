"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Check, Copy, Download, Users, Star, TrendingUp, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        player.isCurrentMember
          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
          : "bg-card border-border",
        isSelected && "ring-2 ring-primary",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        disabled={isDisabled}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-foreground truncate">
            {player.name}
          </span>
          {player.isCurrentMember && (
            <Badge variant="default" className="text-xs bg-emerald-600">
              No Clã
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="font-mono">{player.tag}</span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            {player.avgStars}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {player.performanceScore.toFixed(2)}
          </span>
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {player.attackCount} ataques
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
    
    // Ordena
    return filtered.sort((a, b) => {
      // Prioriza membros atuais
      if (a.isCurrentMember && !b.isCurrentMember) return -1;
      if (!a.isCurrentMember && b.isCurrentMember) return 1;
      // Depois ordena por performance score
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Seleção CWL - Liga de Clãs
              </CardTitle>
              <CardDescription>
                Selecione os 15 melhores jogadores para participar da CWL
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {selectedPlayers.size}/15 selecionados
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Buscar jogador por nome ou tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>💡 Dica:</strong> Os jogadores que estão no clã atualmente aparecem destacados em verde.
              Você pode selecionar até 15 jogadores baseado nas últimas 50 guerras normais.
            </AlertDescription>
          </Alert>

          {/* Players List */}
          <ScrollArea className="h-[500px] rounded-md border p-4">
            <div className="space-y-2">
              {availablePlayers.map((player) => {
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
              })}
            </div>
          </ScrollArea>

          {/* Actions */}
          {selectedPlayers.size > 0 && (
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button
                onClick={() => setShowShareView(true)}
                className="flex-1"
                variant="default"
              >
                <Users className="w-4 h-4 mr-2" />
                Ver Lista Compartilhável
              </Button>
              <Button onClick={copyToClipboard} variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
              <Button onClick={downloadAsText} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Baixar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share View Modal */}
      {showShareView && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lista Compartilhável - CWL</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowShareView(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                  {shareableText}
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Texto
                  </Button>
                  <Button onClick={downloadAsText} variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar TXT
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

