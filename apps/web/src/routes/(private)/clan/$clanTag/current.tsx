import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { getClanInfoQueryOptions } from "@/api";
import { getCurrentWarQueryOptions } from "@/api/queries/wars";
import { CurrentWar } from "../-current-war";
import { Sword, Loader2 } from "lucide-react";

export const Route = createFileRoute("/(private)/clan/$clanTag/current")({
  loader: async ({ context: { queryClient }, params }) => {
    // Tenta carregar a guerra atual, mas não bloqueia se não houver
    try {
      await queryClient.ensureQueryData(getCurrentWarQueryOptions(params.clanTag));
    } catch {
      // Ignora erros (guerra pode não existir)
    }
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
  const { data: clanStats } = useSuspenseQuery(getClanInfoQueryOptions(clanTag));
  const { data: currentWar, isLoading: isLoadingWar, isFetching: isFetchingWar } = useQuery({
    ...getCurrentWarQueryOptions(clanTag),
    refetchOnMount: true, // Sempre refaz a requisição quando o componente monta
    refetchOnWindowFocus: false, // Não refaz ao focar a janela
  });

  useEffect(() => {
    document.title = `${clanStats.name} - Guerra Atual | Clashdata`;
  }, [clanStats.name]);

  if (isLoadingWar || isFetchingWar) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {currentWar ? (
        <CurrentWar war={currentWar} clanTag={clanTag} />
      ) : (
        <div className="bg-card border border-border rounded-xl p-8 sm:p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Sword className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              Nenhuma guerra em andamento
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Este clã não possui uma guerra atual no momento. Quando uma guerra começar, os detalhes aparecerão aqui.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
