import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getClanInfoQueryOptions } from "@/api";
import { getWarHistoryQueryOptions } from "@/api/queries/dashboard";
import { CurrentWar } from "../-current-war";
import { History, Trophy, XCircle, Minus, ChevronLeft, ChevronRight, Star, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { CurrentWar as CurrentWarType } from "../-current-war-types";

const WARS_PER_PAGE = 5;

export const Route = createFileRoute("/(private)/clan/$clanTag/history")({
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData(getWarHistoryQueryOptions(params.clanTag, WARS_PER_PAGE, 0));
  },
  pendingComponent: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ),
  component: RouteComponent,
});

function RouteComponent() {
  const { clanTag } = Route.useParams();
  const [currentPage, setCurrentPage] = useState(0);
  const offset = currentPage * WARS_PER_PAGE;

  const { data: clanStats } = useSuspenseQuery(getClanInfoQueryOptions(clanTag));
  const { data: warHistory, isLoading } = useQuery({
    ...getWarHistoryQueryOptions(clanTag, WARS_PER_PAGE, offset),
    refetchOnMount: true,
  });

  // Normaliza a tag para comparação
  const normalizeTagForComparison = (tag: string) => {
    return tag.startsWith("#") ? tag : `#${tag}`;
  };

  const normalizedClanTag = normalizeTagForComparison(clanTag);

  // Processa as guerras e determina vitória/derrota/empate
  const processedWars = useMemo(() => {
    if (!warHistory?.items) return [];

    return warHistory.items
      .map((war: any) => {
        // Determina qual é o clã do usuário
        const normalizedWarClanTag = normalizeTagForComparison(war.clan?.tag || "");
        const isUserClan = normalizedWarClanTag === normalizedClanTag;
        
        const userClan = isUserClan ? war.clan : war.opponent;
        const opponentClan = isUserClan ? war.opponent : war.clan;

        if (!userClan || !opponentClan) return null;

        const userStars = userClan.stars || 0;
        const opponentStars = opponentClan.stars || 0;

        let result: "victory" | "defeat" | "tie" = "tie";
        if (userStars > opponentStars) {
          result = "victory";
        } else if (opponentStars > userStars) {
          result = "defeat";
        }

        return {
          ...war,
          result,
          userClan,
          opponentClan,
        };
      })
      .filter((war: any) => war !== null)
      .sort((a: any, b: any) => {
        // Ordena por data de término (mais recente primeiro)
        const dateA = a.endTime ? new Date(a.endTime).getTime() : 0;
        const dateB = b.endTime ? new Date(b.endTime).getTime() : 0;
        return dateB - dateA;
      });
  }, [warHistory, normalizedClanTag]);

  const hasMore = warHistory?.hasMore ?? false;
  const totalWars = warHistory?.total ?? processedWars.length;
  const totalPages = Math.ceil(totalWars / WARS_PER_PAGE);

  useEffect(() => {
    document.title = `${clanStats.name} - Histórico de Guerras | Clashdata`;
  }, [clanStats.name]);

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (hasMore || currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!processedWars || processedWars.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 sm:p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <History className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
            Nenhuma guerra no histórico
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Este clã ainda não possui guerras registradas no histórico.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Histórico de Guerras</h3>
          </div>
          <div className="text-sm text-muted-foreground">
            Página {currentPage + 1} de {totalPages > 0 ? totalPages : 1}
          </div>
        </div>

        {/* Lista de Guerras */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : processedWars && processedWars.length > 0 ? (
          <>
            <Accordion type="single" collapsible className="space-y-3">
              {processedWars.map((war: any, index: number) => {
                const endDate = war.endTime ? new Date(war.endTime) : null;
                const isValidEndDate = endDate !== null && !isNaN(endDate.getTime());

                // Cria um objeto CurrentWar compatível
                const currentWarData: CurrentWarType = {
                  ...war,
                  state: "warEnded",
                  clan: war.userClan,
                  opponent: war.opponentClan,
                };

                const userStars = war.userClan.stars || 0;
                const opponentStars = war.opponentClan.stars || 0;
                const userDestruction = war.userClan.destructionPercentage || 0;
                const opponentDestruction = war.opponentClan.destructionPercentage || 0;

                return (
                  <AccordionItem
                    key={index}
                    value={`war-${index}`}
                    className="border border-border rounded-xl overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 sm:px-6 py-4 hover:no-underline bg-muted/50 rounded-t-xl">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1">
                          {war.result === "victory" && (
                            <div className="flex items-center gap-2 text-emerald-500">
                              <Trophy className="w-5 h-5 shrink-0" />
                              <span className="font-semibold text-sm sm:text-base">Vitória</span>
                            </div>
                          )}
                          {war.result === "defeat" && (
                            <div className="flex items-center gap-2 text-rose-500">
                              <XCircle className="w-5 h-5 shrink-0" />
                              <span className="font-semibold text-sm sm:text-base">Derrota</span>
                            </div>
                          )}
                          {war.result === "tie" && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Minus className="w-5 h-5 shrink-0" />
                              <span className="font-semibold text-sm sm:text-base">Empate</span>
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-left">
                            <div className="text-sm sm:text-base font-medium text-foreground">
                              {war.userClan.name} vs {war.opponentClan.name}
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="font-medium">{userStars}</span>
                              </div>
                              <span>×</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="font-medium">{opponentStars}</span>
                              </div>
                              <span className="mx-1">•</span>
                              <span>{userDestruction.toFixed(1)}% vs {opponentDestruction.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                        {isValidEndDate && (
                          <div className="text-xs sm:text-sm text-muted-foreground shrink-0 hidden sm:block">
                            {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0">
                      <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
                        {isValidEndDate && (
                          <div className="text-xs sm:text-sm text-muted-foreground mb-4 sm:hidden">
                            {format(endDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        )}
                        <CurrentWar war={currentWarData} clanTag={clanTag} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {/* Controles de Paginação */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentPage === 0 || isLoading}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
                <span className="sm:hidden">Ant</span>
              </Button>

              <div className="text-sm text-muted-foreground">
                Mostrando {offset + 1} - {Math.min(offset + WARS_PER_PAGE, totalWars)} de {totalWars} guerras
              </div>

              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={!hasMore && currentPage >= totalPages - 1 || isLoading}
                className="gap-2"
              >
                <span className="hidden sm:inline">Próxima</span>
                <span className="sm:hidden">Próx</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <History className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-base font-medium text-foreground mb-1">
              Nenhuma guerra no histórico
            </p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Este clã ainda não possui guerras registradas no histórico.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
