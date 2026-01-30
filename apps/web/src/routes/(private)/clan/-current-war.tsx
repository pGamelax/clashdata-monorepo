import { useMemo } from "react";
import { Clock, Star, Target, Trophy, TrendingUp, TrendingDown, Sword, Shield, Users, MessageSquare } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CurrentWar, StarClosureInfo, CurrentWarAttack } from "./-current-war-types";

interface CurrentWarProps {
  war: CurrentWar;
  clanTag: string;
}

interface AttackMessage {
  attackerTag: string;
  attackerName: string;
  defenderTag: string;
  defenderName: string;
  stars: number;
  destructionPercentage: number;
  order: number;
  duration: number;
  isUserClan: boolean;
  clanName: string;
}

export function CurrentWar({ war, clanTag }: CurrentWarProps) {
  // Normaliza a tag para comparação
  const normalizeTagForComparison = (tag: string) => {
    return tag.startsWith("#") ? tag : `#${tag}`;
  };

  // Verifica se é o clã do usuário ou o oponente
  const normalizedClanTag = normalizeTagForComparison(clanTag);
  const normalizedWarClanTag = normalizeTagForComparison(war.clan.tag);
  const isUserClan = normalizedWarClanTag === normalizedClanTag;
  
  const userClan = isUserClan ? war.clan : war.opponent;
  const opponentClan = isUserClan ? war.opponent : war.clan;
  const hasOpponent = !!opponentClan;

  // Calcula qual foi o último jogador que fechou 3 estrelas
  const starClosureInfo = useMemo(() => {
    if (!userClan || !hasOpponent || !opponentClan) return null;

    const maxStars = war.teamSize * 3;
    const allAttacks: Array<{
      attackerTag: string;
      attackerName: string;
      defenderTag: string;
      defenderName: string;
      stars: number;
      order: number;
      duration: number;
    }> = [];

    // Coleta todos os ataques do clã do usuário
    userClan.members.forEach((member) => {
      if (member.attacks) {
        member.attacks.forEach((attack) => {
          const defender = opponentClan.members.find((m) => m.tag === attack.defenderTag);
          if (defender) {
            allAttacks.push({
              attackerTag: member.tag,
              attackerName: member.name,
              defenderTag: defender.tag,
              defenderName: defender.name,
              stars: attack.stars,
              order: attack.order,
              duration: attack.duration,
            });
          }
        });
      }
    });

    // Ordena por ordem de ataque
    allAttacks.sort((a, b) => a.order - b.order);

    // Rastreia quais defensores já receberam 3 estrelas
    const defenderStars: Record<string, number> = {};
    opponentClan.members.forEach((member) => {
      defenderStars[member.tag] = 0;
    });

    let totalStars = 0;
    let lastClosure: StarClosureInfo | null = null;

    // Processa cada ataque em ordem
    for (const attack of allAttacks) {
      const currentDefenderStars = defenderStars[attack.defenderTag];
      
      // Se o ataque é de 3 estrelas e o defensor ainda não tem 3 estrelas
      if (attack.stars === 3 && currentDefenderStars < 3) {
        // Atualiza para 3 estrelas (primeiro ataque de 3 estrelas conta)
        const previousStars = currentDefenderStars;
        defenderStars[attack.defenderTag] = 3;
        totalStars = totalStars - previousStars + 3;

        // Verifica se chegou ao máximo de estrelas
        if (totalStars === maxStars) {
          lastClosure = {
            playerTag: attack.attackerTag,
            playerName: attack.attackerName,
            attackOrder: attack.order,
            defenderTag: attack.defenderTag,
            defenderName: attack.defenderName,
            timestamp: attack.order,
          };
          break;
        }
      } else if (attack.stars < 3) {
        // Para ataques menores que 3 estrelas, só atualiza se:
        // 1. O defensor ainda não tem 3 estrelas (não foi fechado)
        // 2. O novo ataque é melhor que o anterior
        if (currentDefenderStars < 3 && attack.stars > currentDefenderStars) {
          const previousStars = currentDefenderStars;
          defenderStars[attack.defenderTag] = attack.stars;
          totalStars = totalStars - previousStars + attack.stars;
        }
      }
      // Se o ataque é de 3 estrelas mas o defensor já tem 3 estrelas, não conta (ignora)
    }

    return lastClosure;
  }, [war, userClan, opponentClan]);

  // Coleta todos os ataques para o chat (meu clã e oponente)
  const allAttackMessages = useMemo(() => {
    if (!userClan || !hasOpponent || !opponentClan) return [];

    const messages: AttackMessage[] = [];

    // Ataques do meu clã
    userClan.members.forEach((member) => {
      if (member.attacks) {
        member.attacks.forEach((attack) => {
          const defender = opponentClan.members.find((m) => m.tag === attack.defenderTag);
          if (defender) {
            messages.push({
              attackerTag: member.tag,
              attackerName: member.name,
              defenderTag: defender.tag,
              defenderName: defender.name,
              stars: attack.stars,
              destructionPercentage: attack.destructionPercentage,
              order: attack.order,
              duration: attack.duration,
              isUserClan: true,
              clanName: userClan.name,
            });
          }
        });
      }
    });

    // Ataques do oponente
    opponentClan.members.forEach((member) => {
      if (member.attacks) {
        member.attacks.forEach((attack) => {
          const defender = userClan.members.find((m) => m.tag === attack.defenderTag);
          if (defender) {
            messages.push({
              attackerTag: member.tag,
              attackerName: member.name,
              defenderTag: defender.tag,
              defenderName: defender.name,
              stars: attack.stars,
              destructionPercentage: attack.destructionPercentage,
              order: attack.order,
              duration: attack.duration,
              isUserClan: false,
              clanName: opponentClan.name,
            });
          }
        });
      }
    });

    // Ordena por ordem de ataque
    return messages.sort((a, b) => a.order - b.order);
  }, [userClan, opponentClan, hasOpponent]);

  // Calcula estatísticas
  const stats = useMemo(() => {
    if (!userClan || !opponentClan) return null;

    const allAttacks = userClan.members.flatMap((m) => m.attacks || []);
    const totalAttacks = allAttacks.length;
    const totalStars = userClan.stars;
    const totalDestruction = userClan.destructionPercentage;
    const avgStars = totalAttacks > 0 ? (totalStars / totalAttacks).toFixed(2) : "0.00";
    const avgDestruction = totalAttacks > 0 ? (totalDestruction / totalAttacks).toFixed(2) : "0.00";

    // Ordena ataques por ordem
    const sortedAttacks = [...allAttacks].sort((a, b) => a.order - b.order);
    // Calcula duração média em minutos (arredonda para 1 casa decimal)
    const avgDurationSeconds = sortedAttacks.length > 0
      ? sortedAttacks.reduce((sum, a) => sum + a.duration, 0) / sortedAttacks.length
      : 0;
    const avgDuration = avgDurationSeconds > 0 ? (avgDurationSeconds / 60).toFixed(1) : "0.0";

    return {
      totalAttacks,
      totalStars,
      totalDestruction,
      avgStars,
      avgDestruction,
      avgDuration,
      sortedAttacks,
    };
  }, [userClan]);

  // Calcula quem está ganhando
  const warStatus = useMemo(() => {
    if (!userClan || !hasOpponent) return null;

    const userStars = userClan.stars;
    const opponentStars = opponentClan.stars;

    if (userStars > opponentStars) {
      return { winner: "user", margin: userStars - opponentStars };
    } else if (opponentStars > userStars) {
      return { winner: "opponent", margin: opponentStars - userStars };
    } else {
      // Empate em estrelas - empate é empate, não separa por destruição
      return { winner: "tie", margin: 0 };
    }
  }, [userClan, opponentClan]);

  // Calcula possibilidade de vitória
  const victoryPossibility = useMemo(() => {
    if (!userClan || !hasOpponent || !opponentClan || !stats) return null;

    const maxStarsPossible = war.teamSize * 3; // Máximo absoluto de estrelas
    const currentUserStars = userClan.stars || 0;
    const currentOpponentStars = opponentClan.stars || 0;

    // Calcula quantas estrelas ainda podem ser ganhas
    // Baseado em quais defensores ainda não têm 3 estrelas
    const defenderStars: Record<string, number> = {};
    opponentClan.members.forEach((member) => {
      // Inicializa com 0 estrelas
      defenderStars[member.tag] = 0;
    });

    // Processa todos os ataques para ver quais defensores já têm 3 estrelas
    const allAttacks = userClan.members.flatMap((m) => m.attacks || []);
    allAttacks.forEach((attack) => {
      const currentStars = defenderStars[attack.defenderTag] || 0;
      // Atualiza apenas se o novo ataque for melhor
      if (attack.stars > currentStars) {
        defenderStars[attack.defenderTag] = attack.stars;
      }
    });

    // Calcula quantas estrelas ainda podem ser ganhas
    let potentialAdditionalStars = 0;
    Object.values(defenderStars).forEach((stars) => {
      if (stars < 3) {
        potentialAdditionalStars += (3 - stars);
      }
    });

    // O máximo possível nunca pode ultrapassar o máximo absoluto
    const maxPossibleStars = Math.min(
      currentUserStars + potentialAdditionalStars,
      maxStarsPossible
    );

    // Vitória ainda é possível se:
    // 1. Ainda há estrelas para ganhar E
    // 2. O máximo possível é maior que as estrelas do oponente
    const canStillWin = potentialAdditionalStars > 0 && maxPossibleStars > currentOpponentStars;

    return {
      possible: canStillWin,
      maxStars: maxPossibleStars,
      currentStars: currentUserStars,
      potentialAdditional: potentialAdditionalStars,
      maxPossible: maxStarsPossible,
    };
  }, [userClan, opponentClan, stats, war, hasOpponent]);

  // Se não há dados do clã do usuário, não podemos mostrar nada
  if (!userClan) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">Dados da guerra não disponíveis</p>
      </div>
    );
  }

  // Valida e cria datas de forma segura
  const startDate = war.startTime ? new Date(war.startTime) : null;
  const endDate = war.endTime ? new Date(war.endTime) : null;
  const preparationStartDate = war.preparationStartTime ? new Date(war.preparationStartTime) : null;
  
  const now = new Date();
  
  // Verifica se as datas são válidas
  const isValidStartDate = startDate !== null && !isNaN(startDate.getTime());
  const isValidEndDate = endDate !== null && !isNaN(endDate.getTime());
  const isValidPreparationDate = preparationStartDate !== null && !isNaN(preparationStartDate.getTime());
  
  const isPreparation = war.state === "preparation";
  const isInWar = war.state === "inWar";
  const isWarEnded = war.state === "warEnded";
  const isEnded = isWarEnded || (isValidEndDate && endDate !== null && endDate.getTime() <= now.getTime());
  const showWarDetails = isInWar || isEnded || isWarEnded;
  
  // Determina qual data usar para exibir - sempre prioriza endDate quando disponível
  const displayDate = isValidEndDate && endDate !== null
    ? endDate
    : isPreparation && isValidPreparationDate && preparationStartDate !== null
    ? preparationStartDate 
    : isValidStartDate && startDate !== null
    ? startDate
    : null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">
            {isWarEnded || isEnded ? "Guerra Finalizada" : "Guerra Atual"}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {(() => {
                  // Se a guerra terminou (warEnded ou data passou), sempre mostra a data final
                  if ((isEnded || isWarEnded) && isValidEndDate && endDate) {
                    return <>Finalizada em {format(endDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</>;
                  }
                  // Se está em guerra e tem data final válida
                  if (isInWar && isValidEndDate && endDate) {
                    return (
                      <>
                        Termina em {formatDistanceToNow(endDate, { locale: ptBR, addSuffix: true })}
                        {` (${format(endDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })})`}
                      </>
                    );
                  }
                  // Se está em preparação
                  if (isPreparation && isValidPreparationDate && preparationStartDate) {
                    return <>Inicia em {formatDistanceToNow(preparationStartDate, { locale: ptBR, addSuffix: true })}</>;
                  }
                  // Fallback: se tem data final válida, mostra mesmo que não esteja em estado específico
                  if (isValidEndDate && endDate) {
                    return <>Finalizada em {format(endDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</>;
                  }
                  // Se tem data de início válida mas não tem final
                  if (isValidStartDate && startDate) {
                    return <>Inicia em {formatDistanceToNow(startDate, { locale: ptBR, addSuffix: true })}</>;
                  }
                  return "Data não disponível";
                })()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{war.teamSize} vs {war.teamSize}</span>
            </div>
            {isPreparation && (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-yellow-500 font-medium">Preparação</span>
              </div>
            )}
            {isInWar && !isEnded && (
              <div className="flex items-center gap-2">
                <Sword className="w-4 h-4" />
                <span className="text-red-500 font-medium">Em Guerra</span>
              </div>
            )}
            {(isEnded || isWarEnded) && (
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span className="text-muted-foreground font-medium">Finalizada</span>
              </div>
            )}
          </div>
        </div>
        {warStatus && showWarDetails && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            warStatus.winner === "user"
              ? "bg-green-500/10 text-green-500"
              : warStatus.winner === "opponent"
              ? "bg-red-500/10 text-red-500"
              : "bg-yellow-500/10 text-yellow-500"
          }`}>
            {warStatus.winner === "user" ? (
              <TrendingUp className="w-5 h-5" />
            ) : warStatus.winner === "opponent" ? (
              <TrendingDown className="w-5 h-5" />
            ) : (
              <Target className="w-5 h-5" />
            )}
            <span className="font-semibold text-sm">
              {warStatus.winner === "user"
                ? isEnded || isWarEnded
                  ? `Ganhou por ${warStatus.margin} estrelas`
                  : `Ganhandando por ${warStatus.margin} estrelas`
                : warStatus.winner === "opponent"
                ? isEnded || isWarEnded
                  ? `Perdeu por ${warStatus.margin} estrelas`
                  : `Perdendo por ${warStatus.margin} estrelas`
                : "Empate"}
            </span>
          </div>
        )}
        {isPreparation && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-500">
            <Shield className="w-5 h-5" />
            <span className="font-semibold text-sm">Fase de Preparação</span>
          </div>
        )}
      </div>

      {/* Estatísticas principais - durante a guerra ou finalizada */}
      {showWarDetails && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Estrelas</span>
            </div>
            <div className="text-2xl font-bold">{userClan.stars}</div>
            {hasOpponent && (
              <div className="text-xs text-muted-foreground mt-1">
                vs {opponentClan?.stars || 0}
              </div>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Destruição</span>
            </div>
            <div className="text-2xl font-bold">{userClan.destructionPercentage}%</div>
            {hasOpponent && (
              <div className="text-xs text-muted-foreground mt-1">
                vs {opponentClan?.destructionPercentage || 0}%
              </div>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sword className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Ataques</span>
            </div>
            <div className="text-2xl font-bold">{userClan.attacks}</div>
            <div className="text-xs text-muted-foreground mt-1">
              de {war.teamSize * war.attacksPerMember}
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Duração Média</span>
            </div>
            <div className="text-2xl font-bold">{stats?.avgDuration || "0.0"} min</div>
            <div className="text-xs text-muted-foreground mt-1">
              por ataque
            </div>
          </div>
        </div>
      )}

      {/* Informações durante preparação */}
      {isPreparation && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Fase de Preparação</h3>
              <p className="text-sm text-muted-foreground">
                A guerra ainda não começou. Os membros estão se preparando para a batalha.
                {isValidStartDate && (
                  <> A guerra começará em {formatDistanceToNow(startDate!, { locale: ptBR, addSuffix: true })}.</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Informação sobre fechamento de estrelas - durante a guerra ou finalizada */}
      {showWarDetails && starClosureInfo && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Trophy className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Fechamento de Estrelas Máximas</h3>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{starClosureInfo.playerName}</span> fechou as{" "}
                <span className="font-medium text-foreground">{war.teamSize * 3} estrelas</span> ao fazer{" "}
                <span className="font-medium text-foreground">3 estrelas</span> em{" "}
                <span className="font-medium text-foreground">{starClosureInfo.defenderName}</span> no ataque #{starClosureInfo.attackOrder}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Possibilidade de vitória - durante a guerra ou finalizada */}
      {showWarDetails && victoryPossibility && (
        <div className={`rounded-lg p-4 ${
          victoryPossibility.possible
            ? "bg-green-500/10 border border-green-500/20"
            : victoryPossibility.maxStars === victoryPossibility.maxPossible && 
              userClan.stars === opponentClan?.stars
            ? "bg-yellow-500/10 border border-yellow-500/20"
            : "bg-red-500/10 border border-red-500/20"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {victoryPossibility.possible ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : victoryPossibility.maxStars === victoryPossibility.maxPossible && 
                 userClan.stars === opponentClan?.stars ? (
              <Target className="w-5 h-5 text-yellow-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
            <h3 className="font-semibold text-sm">
              {victoryPossibility.maxStars === victoryPossibility.maxPossible && 
               userClan.stars === opponentClan?.stars
                ? "Guerra Empatada - Máximo de Estrelas Alcançado"
                : victoryPossibility.possible 
                ? "Vitória Ainda Possível" 
                : "Vitória Improvável"}
            </h3>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              Estrelas atuais: <span className="font-medium text-foreground">{victoryPossibility.currentStars}</span> / {victoryPossibility.maxPossible}
              {victoryPossibility.potentialAdditional > 0 && (
                <> (+{victoryPossibility.potentialAdditional} possíveis)</>
              )}
            </p>
            {hasOpponent && opponentClan && (
              <p>
                Oponente: <span className="font-medium text-foreground">{opponentClan.stars}</span> / {victoryPossibility.maxPossible} estrelas
              </p>
            )}
          </div>
        </div>
      )}

      {/* Chat de Ataques - todos os ataques da guerra */}
      {allAttackMessages.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Ataques da Guerra</h3>
          </div>
          
          {/* Desktop: Tabela */}
          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-full">
              <div className="bg-muted/30 rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-3 border-b border-border/50 text-sm font-semibold text-muted-foreground">
                  <div className="col-span-1">#</div>
                  <div className="col-span-3">Atacante</div>
                  <div className="col-span-3">Defensor</div>
                  <div className="col-span-1 text-center">⭐</div>
                  <div className="col-span-1 text-center">💥</div>
                  <div className="col-span-1 text-center">⏱️</div>
                  <div className="col-span-2 text-right">Clã</div>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {allAttackMessages.map((msg) => (
                    <div
                      key={`${msg.attackerTag}-${msg.order}-${msg.isUserClan ? "user" : "opponent"}`}
                      className={`grid grid-cols-12 gap-4 p-3 border-b border-border/30 last:border-0 hover:bg-muted/50 transition-colors ${
                        msg.isUserClan ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="col-span-1 text-sm font-medium text-muted-foreground">
                        #{msg.order}
                      </div>
                      <div className="col-span-3 text-sm font-medium">
                        {msg.attackerName}
                      </div>
                      <div className="col-span-3 text-sm">
                        {msg.defenderName}
                      </div>
                      <div className="col-span-1 flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">{msg.stars}</span>
                      </div>
                      <div className="col-span-1 flex items-center justify-center gap-1">
                        <Target className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium">{msg.destructionPercentage}%</span>
                      </div>
                      <div className="col-span-1 flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{(msg.duration / 60).toFixed(1)}</span>
                      </div>
                      <div className={`col-span-2 text-right text-xs font-medium ${
                        msg.isUserClan ? "text-primary" : "text-muted-foreground"
                      }`}>
                        {msg.clanName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3 max-h-[600px] overflow-y-auto">
            {allAttackMessages.map((msg) => (
              <div
                key={`${msg.attackerTag}-${msg.order}-${msg.isUserClan ? "user" : "opponent"}`}
                className={`bg-muted/30 rounded-lg p-4 border ${
                  msg.isUserClan 
                    ? "border-primary/30 bg-primary/5" 
                    : "border-border/30"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">#{msg.order}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        msg.isUserClan 
                          ? "bg-primary/20 text-primary" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {msg.clanName}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{msg.attackerName}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-sm">{msg.defenderName}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-2 border-t border-border/30">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">{msg.stars}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">{msg.destructionPercentage}%</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{(msg.duration / 60).toFixed(1)} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
