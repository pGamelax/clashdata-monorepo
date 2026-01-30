import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  getClanInfoQueryOptions,
  getNormalWarsQueryOptions,
  getClanRankingQueryOptions,
} from "@/api";
import { DataTable } from "../-data-table";
import { columns } from "../-columns";
import { CWLSelector } from "../-cwl-selector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Calendar } from "lucide-react";
import { WarsTableSkeleton } from "./-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INITIAL_LIMIT = 5;
const WAR_LIMIT_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50];


export const Route = createFileRoute("/(private)/clan/$clanTag/normal")({
  loader: async ({ context: { queryClient }, params }) => {
    // Carrega apenas as primeiras 5 guerras normais para carregamento rápido
    await queryClient.ensureQueryData(getNormalWarsQueryOptions(params.clanTag, INITIAL_LIMIT, 0));
    queryClient.prefetchQuery(getClanRankingQueryOptions(params.clanTag)).catch(() => {});
  },
  pendingComponent: () => (
    <div className="space-y-3 sm:space-y-4">
      <WarsTableSkeleton />
    </div>
  ),
  component: RouteComponent,
});

function RouteComponent() {
  const { clanTag } = Route.useParams();
  const [isCWLSelectorOpen, setIsCWLSelectorOpen] = useState(false);
  const [selectedWarLimit, setSelectedWarLimit] = useState<number>(INITIAL_LIMIT);
  const [searchFilter, setSearchFilter] = useState("");

  const { data: clanStats } = useSuspenseQuery(getClanInfoQueryOptions(clanTag));
  const { data: quickData, isLoading: isLoadingQuick } = useSuspenseQuery({
    ...getNormalWarsQueryOptions(clanTag, INITIAL_LIMIT, 0),
    refetchOnMount: true,
  });

  // Busca dados com o limite selecionado
  const { data: fullData, isFetching: isLoadingMore } = useQuery({
    ...getNormalWarsQueryOptions(clanTag, selectedWarLimit, 0),
    enabled: selectedWarLimit !== INITIAL_LIMIT,
    placeholderData: quickData,
  });

  // Ranking do clã para obter membros atuais
  const { data: clanRanking } = useQuery(getClanRankingQueryOptions(clanTag));

  // Usa dados completos se disponíveis, senão usa os rápidos
  const data = fullData || quickData;

  // Filtra e processa os dados
  const clanWars = useMemo(() => {
    if (!data?.players) return { players: [] };

    let filteredPlayers = data.players.map((p: any) => ({
      ...p,
      allDefenses: p.allDefenses.map((d: any) => ({ ...d, opponent: "" })),
    }));

    // Aplica filtro de busca por nome
    if (searchFilter) {
      filteredPlayers = filteredPlayers.filter((player: any) =>
        player.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        player.tag.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    return { players: filteredPlayers };
  }, [data, searchFilter]);


  // Lista de tags dos membros atuais do clã
  const currentClanMemberTags = useMemo(() => {
    return clanRanking?.players?.map((p: any) => p.playerTag) || [];
  }, [clanRanking]);

  useEffect(() => {
    document.title = `${clanStats.name} - Guerras Normais | Clashdata`;
  }, [clanStats.name]);

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        {isLoadingQuick && !quickData ? (
          <WarsTableSkeleton />
        ) : (
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
            {/* Cabeçalho com filtros */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Guerras Normais</h3>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Busca por jogador */}
                <div className="relative w-full sm:w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar jogador..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-9 h-11 rounded-xl border-2 border-border/50 bg-muted/30 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
                  />
                </div>

                {/* Filtro por quantidade de guerras */}
                <Select 
                  value={selectedWarLimit.toString()} 
                  onValueChange={(value) => setSelectedWarLimit(Number(value))}
                >
                  <SelectTrigger className="w-full sm:w-[250px] h-11 rounded-xl border-2 border-border/50 bg-muted/30 backdrop-blur-sm">
                    <SelectValue placeholder="Quantidade de guerras" />
                  </SelectTrigger>
                  <SelectContent>
                    {WAR_LIMIT_OPTIONS.map((limit) => (
                      <SelectItem key={limit} value={limit.toString()}>
                        {limit} guerras
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabela de dados */}
            {isLoadingMore && selectedWarLimit !== INITIAL_LIMIT ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : clanWars.players && clanWars.players.length > 0 ? (
              <DataTable columns={columns} data={clanWars.players} hideDateFilters={true} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <p className="text-base font-medium text-foreground mb-1">
                  Nenhum dado encontrado
                </p>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {searchFilter
                    ? "Nenhum jogador encontrado com o termo de busca."
                    : "Este clã ainda não possui dados de guerras normais registrados."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isCWLSelectorOpen} onOpenChange={setIsCWLSelectorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seleção CWL - Liga de Clãs</DialogTitle>
          </DialogHeader>
          <CWLSelector
            players={clanWars.players as any}
            currentClanMembers={currentClanMemberTags}
            clanName={clanStats.name}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
