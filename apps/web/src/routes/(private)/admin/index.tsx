import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api";
import { useEffect, useState } from "react";
import { Shield, Users, Search, AlertCircle, LayoutDashboard, BarChart3, Eye, UserCog, Calendar, Trophy } from "lucide-react";
import { DashboardTab } from "./components/-DashboardTab";
import { ClansTab } from "./components/-ClansTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSessionQueryOptions,
  getAllClansQueryOptions,
  getAllUsersQueryOptions,
  apiFetch,
  setSeasonEndDate,
  fetchSeasonData,
  getAllConfigsQueryOptions,
  type SeasonConfig,
} from "@/api";

export const Route = createFileRoute("/(private)/admin/")({
  loader: async ({ context: { queryClient } }) => {
    try {
      const session = await queryClient.ensureQueryData(getSessionQueryOptions) as { user?: { role?: string } };
      
      // Verifica se o usuário é admin
      if (!session?.user?.role || session.user.role !== "admin") {
        throw redirect({
          to: "/clans",
          search: {
            error: "Acesso negado. Apenas administradores podem acessar este painel.",
          },
        });
      }

      // Carrega dados do admin
      await Promise.all([
        queryClient.ensureQueryData(getAllClansQueryOptions),
        queryClient.ensureQueryData(getAllUsersQueryOptions),
      ]);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          throw redirect({
            to: "/sign-in",
            search: {
              error: "Sua sessão expirou. Faça login novamente.",
            },
          });
        }
        if (error.status === 403) {
          throw redirect({
            to: "/clans",
            search: {
              error: "Acesso negado. Apenas administradores podem acessar este painel.",
            },
          });
        }
      }
      // Se for redirect, re-lança
      if (error && typeof error === "object" && "to" in error) {
        throw error;
      }
      throw error;
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data: session } = useSuspenseQuery(getSessionQueryOptions);
  const { data: allClans, refetch: refetchClans } = useSuspenseQuery(getAllClansQueryOptions);
  const { data: allUsers, refetch: refetchUsers } = useSuspenseQuery(getAllUsersQueryOptions);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Estados para busca
  const [searchClan, setSearchClan] = useState("");
  const [searchUser, setSearchUser] = useState("");

  // Estados para dialogs
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false);
  const [isEditUserRoleDialogOpen, setIsEditUserRoleDialogOpen] = useState(false);

  // Estados para seleção
  const [selectedUserForView, setSelectedUserForView] = useState<any>(null);
  const [selectedUserForRoleEdit, setSelectedUserForRoleEdit] = useState<any>(null);
  const [newUserRole, setNewUserRole] = useState("user");

  // Estados para formulários
  const [seasonEndDateInput, setSeasonEndDateInput] = useState("");
  
  const { data: seasonConfigs, refetch: refetchSeasonConfigs } = useQuery({
    ...getAllConfigsQueryOptions,
  });

  useEffect(() => {
    document.title = "Painel Admin | Clashdata";
  }, []);

  // Verifica se é admin
  if (!session?.user?.role || session.user.role !== "admin") {
    return null;
  }

  const filteredUsers = allUsers?.filter((user: any) =>
    user.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchUser.toLowerCase())
  ) || [];

  // Estatísticas calculadas
  const totalClans = allClans?.length || 0;
  const totalUsers = allUsers?.length || 0;
  const totalAdmins = allUsers?.filter((u: any) => u.role === "admin").length || 0;
  const totalClanAssignments = allUsers?.reduce((acc: number, user: any) => acc + (user.clans?.length || 0), 0) || 0;
  const clansWithUsers = allClans?.filter((clan: any) => (clan.userCount || 0) > 0).length || 0;
  const clansWithoutUsers = totalClans - clansWithUsers;


  // Usuários de um clã específico
  const getClanUsers = (clanTag: string) => {
    return allUsers?.filter((user: any) => 
      user.clans?.some((c: any) => c.tag?.toLowerCase() === clanTag.toLowerCase())
    ) || [];
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateUserRole = async () => {
    if (!selectedUserForRoleEdit) {
      return;
    }

    try {
      await apiFetch(`${import.meta.env.VITE_API_URL}/admin/update-user-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserForRoleEdit.id,
          role: newUserRole,
        }),
      });

      showToast("success", "Role do usuário atualizada com sucesso");
      setIsEditUserRoleDialogOpen(false);
      setSelectedUserForRoleEdit(null);
      setNewUserRole("user");
      refetchUsers();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        showToast("error", error.message || "Erro ao atualizar role do usuário");
      } else {
        showToast("error", "Erro ao atualizar role do usuário");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* Toast Message */}
        {toastMessage && (
          <div
            className={`fixed top-2 sm:top-4 right-2 sm:right-4 left-2 sm:left-auto z-50 p-3 sm:p-4 rounded-lg border-2 shadow-lg ${
              toastMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "success" ? (
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              )}
              <p className="font-medium text-sm sm:text-base break-words">{toastMessage.message}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 border-2 border-primary/20 flex-shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                Painel Administrativo
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gerencie clãs, usuários e acessos do sistema
              </p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <TabsList className="w-full sm:w-fit grid grid-cols-5 sm:grid-cols-none sm:inline-flex">
              <TabsTrigger value="dashboard" className="flex-shrink-0 text-xs sm:text-sm">
                <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="clans" className="flex-shrink-0 text-xs sm:text-sm">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Clãs</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-shrink-0 text-xs sm:text-sm">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex-shrink-0 text-xs sm:text-sm">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Estatísticas</span>
              </TabsTrigger>
              <TabsTrigger value="seasons" className="flex-shrink-0 text-xs sm:text-sm">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Temporadas</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardTab
              totalClans={totalClans}
              totalUsers={totalUsers}
              totalAdmins={totalAdmins}
              totalClanAssignments={totalClanAssignments}
              clansWithUsers={clansWithUsers}
              clansWithoutUsers={clansWithoutUsers}
            />
          </TabsContent>

          {/* Clãs Tab */}
          <TabsContent value="clans" className="space-y-4">
            <ClansTab
              allClans={allClans}
              allUsers={allUsers}
              searchClan={searchClan}
              setSearchClan={setSearchClan}
              refetchClans={refetchClans}
              refetchUsers={refetchUsers}
              showToast={showToast}
              getClanUsers={getClanUsers}
            />
          </TabsContent>

          {/* Usuários Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Gerenciar Usuários</span>
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuário..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px] text-xs sm:text-sm">Nome</TableHead>
                    <TableHead className="min-w-[120px] sm:min-w-[150px] text-xs sm:text-sm">Email</TableHead>
                    <TableHead className="min-w-[80px] hidden sm:table-cell text-xs sm:text-sm">Clãs</TableHead>
                    <TableHead className="min-w-[70px] text-xs sm:text-sm">Role</TableHead>
                    <TableHead className="text-right min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          <div className="min-w-0">
                            <p className="truncate">{user.name || "N/A"}</p>
                            {user.clans && user.clans.length > 0 && (
                              <div className="sm:hidden mt-1 flex flex-wrap gap-1">
                                {user.clans.slice(0, 2).map((clan: any) => (
                                  <span
                                    key={clan.tag}
                                    className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-mono"
                                  >
                                    {clan.name || clan.tag}
                                  </span>
                                ))}
                                {user.clans.length > 2 && (
                                  <span className="text-[10px] text-muted-foreground">+{user.clans.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[10px] sm:text-xs">
                          <div className="min-w-0">
                            <p className="truncate">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {user.clans?.length > 0 ? (
                              user.clans.map((clan: any) => (
                                <span
                                  key={clan.tag}
                                  className="text-xs px-2 py-1 bg-muted rounded-md font-mono"
                                >
                                  {clan.name || clan.tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-xs">Nenhum</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md font-medium ${
                              user.role === "admin"
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {user.role || "user"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Dialog
                              open={isViewUserDialogOpen && selectedUserForView?.id === user.id}
                              onOpenChange={(open) => {
                                setIsViewUserDialogOpen(open);
                                if (open) {
                                  setSelectedUserForView(user);
                                } else {
                                  setSelectedUserForView(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl mx-2 sm:mx-auto max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-base sm:text-lg">Detalhes do Usuário</DialogTitle>
                                  <DialogDescription className="text-xs sm:text-sm">
                                    Informações completas do usuário
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedUserForView && (
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label>Nome</Label>
                                      <p className="text-sm break-words">{selectedUserForView.name || "N/A"}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Email</Label>
                                      <p className="text-sm font-mono break-all">{selectedUserForView.email}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Role</Label>
                                      <p className="text-sm">
                                        <span
                                          className={`text-xs px-2 py-1 rounded-md font-medium ${
                                            selectedUserForView.role === "admin"
                                              ? "bg-primary/20 text-primary"
                                              : "bg-muted text-muted-foreground"
                                          }`}
                                        >
                                          {selectedUserForView.role || "user"}
                                        </span>
                                      </p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Clãs ({selectedUserForView.clans?.length || 0})</Label>
                                      <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                                        {selectedUserForView.clans?.length > 0 ? (
                                          selectedUserForView.clans.map((clan: any) => (
                                            <span
                                              key={clan.tag}
                                              className="text-xs px-2 py-1 bg-background rounded-md font-mono border break-all"
                                            >
                                              {clan.name || "Sem nome"} ({clan.tag})
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-sm text-muted-foreground">Nenhum clã atribuído</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Dialog
                              open={isEditUserRoleDialogOpen && selectedUserForRoleEdit?.id === user.id}
                              onOpenChange={(open) => {
                                setIsEditUserRoleDialogOpen(open);
                                if (open) {
                                  setSelectedUserForRoleEdit(user);
                                  setNewUserRole(user.role || "user");
                                } else {
                                  setSelectedUserForRoleEdit(null);
                                  setNewUserRole("user");
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                                  <UserCog className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="mx-2 sm:mx-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-base sm:text-lg">Editar Role do Usuário</DialogTitle>
                                  <DialogDescription className="text-xs sm:text-sm">
                                    Altere a role/permissão do usuário
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Usuário</Label>
                                    <p className="text-sm break-all">{user.email}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="userRole">Role *</Label>
                                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                                      <SelectTrigger id="userRole" className="w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter className="flex-col sm:flex-row gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsEditUserRoleDialogOpen(false);
                                      setSelectedUserForRoleEdit(null);
                                      setNewUserRole("user");
                                    }}
                                    className="w-full sm:w-auto"
                                  >
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleUpdateUserRole} className="w-full sm:w-auto">
                                    Salvar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </div>
          </TabsContent>

          {/* Estatísticas Tab */}
          <TabsContent value="stats" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Clãs</CardTitle>
                  <CardDescription>Análise de uso dos clãs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Clãs com usuários</span>
                      <span className="font-medium">{clansWithUsers}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${totalClans > 0 ? (clansWithUsers / totalClans) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Clãs sem usuários</span>
                      <span className="font-medium">{clansWithoutUsers}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-muted-foreground h-2 rounded-full"
                        style={{ width: `${totalClans > 0 ? (clansWithoutUsers / totalClans) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Usuários</CardTitle>
                  <CardDescription>Análise de roles e permissões</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Usuários comuns</span>
                      <span className="font-medium">{totalUsers - totalAdmins}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-muted-foreground h-2 rounded-full"
                        style={{ width: `${totalUsers > 0 ? ((totalUsers - totalAdmins) / totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Administradores</span>
                      <span className="font-medium">{totalAdmins}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${totalUsers > 0 ? (totalAdmins / totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Atribuição</CardTitle>
                  <CardDescription>Estatísticas de clãs por usuário</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Média de clãs por usuário</span>
                      <span className="text-xl sm:text-2xl font-bold">
                        {totalUsers > 0 ? (totalClanAssignments / totalUsers).toFixed(1) : "0"}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Usuários sem clãs</span>
                      <span className="text-xl sm:text-2xl font-bold">
                        {allUsers?.filter((u: any) => !u.clans || u.clans.length === 0).length || 0}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Usuários com mais clãs</span>
                      <span className="text-xl sm:text-2xl font-bold">
                        {allUsers?.reduce((max: number, user: any) => 
                          Math.max(max, user.clans?.length || 0), 0) || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Clãs</CardTitle>
                  <CardDescription>Clãs com mais usuários</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {allClans
                      ?.sort((a: any, b: any) => (b.userCount || 0) - (a.userCount || 0))
                      .slice(0, 5)
                      .map((clan: any, index: number) => (
                        <div key={clan.tag} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 border rounded-lg">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground flex-shrink-0">#{index + 1}</span>
                            <span className="text-xs sm:text-sm font-medium truncate">{clan.name || "Sem nome"}</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate hidden sm:inline">{clan.tag}</span>
                          </div>
                          <span className="text-xs sm:text-sm font-medium flex-shrink-0">{clan.userCount || 0} usuários</span>
                        </div>
                      )) || <p className="text-sm text-muted-foreground">Nenhum clã encontrado</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Seasons Tab */}
          <TabsContent value="seasons" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agendar Worker de Temporada</CardTitle>
                  <CardDescription>
                    Defina a data/hora para agendar o worker que buscará os dados de previousSeason de todos os jogadores dos clans cadastrados.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seasonEndDate">Data/Hora de Execução</Label>
                    <Input
                      id="seasonEndDate"
                      type="datetime-local"
                      onChange={(e) => {
                        if (e.target.value) {
                          const date = new Date(e.target.value);
                          setSeasonEndDateInput(date.toISOString());
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      if (!seasonEndDateInput) {
                        showToast("error", "Selecione uma data/hora");
                        return;
                      }
                      try {
                        await setSeasonEndDate(seasonEndDateInput);
                        showToast("success", "Worker agendado com sucesso");
                        setSeasonEndDateInput("");
                        refetchSeasonConfigs();
                      } catch (error: unknown) {
                        if (error instanceof ApiError) {
                          showToast("error", error.message || "Erro ao agendar worker");
                        } else {
                          showToast("error", "Erro ao agendar worker");
                        }
                      }
                    }}
                    className="w-full"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar Worker
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Workers Agendados</CardTitle>
                  <CardDescription>
                    Lista de todos os workers agendados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {seasonConfigs && seasonConfigs.length > 0 ? (
                      seasonConfigs.map((config: SeasonConfig) => (
                        <div
                          key={config.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {new Date(config.scheduledAt).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {config.isProcessed ? (
                              <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-500 mt-1">
                                Processado
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 mt-1">
                                Pendente
                              </span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const result = await fetchSeasonData(config.id);
                                showToast(
                                  "success",
                                  `Dados salvos: ${result.totalPlayersSaved} jogadores. ${result.playersReset} jogadores tiveram troféus resetados para 5000.`
                                );
                                refetchSeasonConfigs();
                              } catch (error: unknown) {
                                if (error instanceof ApiError) {
                                  showToast("error", error.message || "Erro ao buscar dados");
                                } else {
                                  showToast("error", "Erro ao buscar dados");
                                }
                              }
                            }}
                            disabled={config.isProcessed}
                            className="w-full sm:w-auto"
                          >
                            <Trophy className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">{config.isProcessed ? "Já Processado" : "Executar Agora"}</span>
                            <span className="sm:hidden">{config.isProcessed ? "Processado" : "Executar"}</span>
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum worker agendado
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
