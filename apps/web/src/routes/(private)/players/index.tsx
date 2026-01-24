import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, TrendingUp, Target, Award, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { queryOptions } from "@tanstack/react-query";

const searchPlayerQueryOptions = (playerTag: string) =>
  queryOptions({
    queryKey: ["search-player", playerTag],
    queryFn: async () => {
      if (!playerTag || playerTag.trim() === "") return null;
      const cleanTag = playerTag.replace(/#|%23/g, "").trim();
      return await apiFetch(
        `${import.meta.env.VITE_API_URL}/players?playerTag=${cleanTag}`,
      );
    },
  });

export const Route = createFileRoute("/(private)/players/")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      error: (search.error as string) || undefined,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [searchTag, setSearchTag] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { error: routeError } = Route.useSearch();

  const {
    data: playerData,
    isLoading,
    error,
  } = useQuery({
    ...searchPlayerQueryOptions(searchTag),
    enabled: !!searchTag,
    retry: false,
  });

  // Exibe erro da rota (vindo de redirects)
  useEffect(() => {
    if (routeError) {
      setErrorMessage(routeError);
      // Limpa a mensagem de erro da URL após exibir
      navigate({ 
        to: "/players",
        search: { error: undefined } 
      });
    }
  }, [routeError, navigate]);

  // Exibe erro da query
  useEffect(() => {
    document.title = "Players | Clashdata";
    
    if (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          setErrorMessage("Jogador não encontrado. Verifique a tag fornecida.");
        } else if (error.status === 403) {
          setErrorMessage("Acesso negado. Este jogador não pertence ao seu usuário.");
        } else if (error.status === 400) {
          setErrorMessage(error.message || "Tag inválida. Verifique o formato da tag.");
        } else {
          setErrorMessage(error.message || "Erro ao buscar jogador.");
        }
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao buscar jogador.",
        );
      }
    } else {
      setErrorMessage(null);
    }
  }, [error]);

  const handleSearch = () => {
    if (!searchValue.trim()) return;
    setErrorMessage(null); // Limpa erro anterior
    const tag = searchValue.replace(/#/g, "").trim();
    setSearchTag(tag);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleViewPlayer = () => {
    if (searchTag) {
      navigate({ 
        to: "/players/$playerTag", 
        params: { playerTag: searchTag },
        search: { error: undefined }
      });
    }
  };


  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          Buscar Jogadores
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto px-4">
          Encontre e analise estatísticas detalhadas de jogadores do Clash of Clans
        </p>
      </div>

      {/* Search Section */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Digite a tag do jogador (ex: #ABC123)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-20 h-11 text-sm rounded-lg border border-border bg-card focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-1"
          />
          <Button
            onClick={handleSearch}
            disabled={!searchValue.trim() || isLoading}
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-4 text-xs rounded-lg"
          >
            {isLoading ? "Buscando..." : "Buscar"}
          </Button>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
            <XCircle size={16} className="flex-shrink-0" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Player Preview Card */}
      {playerData && !error && (
        <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
          <div className="space-y-4 sm:space-y-5">
            {/* Player Info */}
            <div className="flex items-center gap-4 sm:gap-5">
              {playerData.leagueTier?.iconUrls?.large && (
                <img
                  src={playerData.leagueTier.iconUrls.large}
                  alt="League"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground truncate">
                    {playerData.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground font-mono">{playerData.tag}</p>
                </div>
                {playerData.clan && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 w-fit bg-muted rounded-lg border border-border">
                    <img
                      src={playerData.clan.badgeUrls.small}
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      alt="Clan"
                    />
                    <span className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[200px]">
                      {playerData.clan.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <div className="bg-muted rounded-lg p-3 border border-border text-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 mx-auto mb-1.5" />
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-1">Troféus</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">{playerData.trophies.toLocaleString()}</p>
              </div>
              <div className="bg-muted rounded-lg p-3 border border-border text-center">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mx-auto mb-1.5" />
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-1">Recorde</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">{playerData.bestTrophies.toLocaleString()}</p>
              </div>
              <div className="bg-muted rounded-lg p-3 border border-border text-center">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mx-auto mb-1.5" />
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-1">Guerras</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">{playerData.warStars}</p>
              </div>
              <div className="bg-muted rounded-lg p-3 border border-border text-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mx-auto mb-1.5" />
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-1">EXP</p>
                <p className="text-sm sm:text-base font-semibold text-foreground">{playerData.expLevel}</p>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleViewPlayer}
              className="w-full h-11 sm:h-12 rounded-lg font-medium"
            >
              Ver Detalhes
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
