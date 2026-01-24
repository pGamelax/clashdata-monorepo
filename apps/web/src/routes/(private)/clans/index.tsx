import { ChevronRight, LayoutGrid, XCircle } from "lucide-react";
import { createFileRoute, useRouter, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

const clansQueryOptions = queryOptions({
  queryKey: ["my-clans"],
  queryFn: () => apiFetch(`${import.meta.env.VITE_API_URL}/clans/get-clans`),
});

export const Route = createFileRoute("/(private)/clans/")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      error: (search.error as string) || undefined,
    };
  },
  loader: async ({ context: { queryClient } }) => {
    try {
      await Promise.all([queryClient.ensureQueryData(clansQueryOptions)]);
    } catch (error) {
      // Erros são tratados no componente
    }
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { data: clans } = useQuery(clansQueryOptions);
  const isEmpty = clans.length === 0;
  const router = useRouter();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { error: routeError } = Route.useSearch();

  // Exibe erro da rota (vindo de redirects)
  useEffect(() => {
    if (routeError) {
      setErrorMessage(routeError);
      // Limpa a mensagem de erro da URL após exibir
      navigate({ 
        to: "/clans",
        search: { error: undefined } 
      });
    }
  }, [routeError, navigate]);

  const handleSetActiveClan = (tag: string) => {
    try {
      router.history.push(`/wars/${tag.replace("#", "")}`);
    } catch (error) {
      console.error("Erro ao definir clã ativo:", error);
    }
  };

  useEffect(() => {
    document.title = "Clans | Clashdata";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* Error Message */}
        {errorMessage && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
            <XCircle size={16} className="flex-shrink-0" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
            Meus Clans
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gerencie e monitore todos os seus clans
          </p>
        </header>

        {/* Empty State */}
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] rounded-xl border border-dashed border-border bg-card p-8 sm:p-12 text-center">
            <div className="p-4 rounded-lg bg-muted border border-border mb-4 sm:mb-6">
              <LayoutGrid size={32} className="sm:w-12 sm:h-12 text-muted-foreground/40" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight mb-2">
              Nenhum clã encontrado
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mt-2">
              Você ainda não vinculou nenhum clã à sua conta do ClashData para
              monitorar estatísticas.
            </p>
          </div>
        ) : (
          /* Clans Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {clans.map((clan: any) => (
              <div
                key={clan.tag}
                onClick={() => handleSetActiveClan(clan.tag)}
                className="bg-card border border-border rounded-xl p-4 sm:p-5 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <h2 className="text-base sm:text-lg lg:text-xl font-semibold truncate text-foreground">
                      {clan.name}
                    </h2>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {clan.tag}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 text-xs sm:text-sm font-medium text-primary pt-2 border-t border-border">
                    <span>Dashboard</span>
                    <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
