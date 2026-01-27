import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api";
import { useEffect, useState } from "react";
import React from "react";
import { Shield, Users, Plus, Search, Trash2, AlertCircle, Database, LayoutDashboard, BarChart3, Edit2, Eye, UserCog, Activity, TrendingUp, Link2, Calendar, Trophy } from "lucide-react";
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
  createClanAdmin,
  addClanToUser,
  revokeClanAccess,
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
  const [isCreateClanDialogOpen, setIsCreateClanDialogOpen] = useState(false);
  const [isAssignClanDialogOpen, setIsAssignClanDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isEditClanDialogOpen, setIsEditClanDialogOpen] = useState(false);
  const [isDeleteClanDialogOpen, setIsDeleteClanDialogOpen] = useState(false);
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false);
  const [isEditUserRoleDialogOpen, setIsEditUserRoleDialogOpen] = useState(false);

  // Estados para seleção
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedClanTag, setSelectedClanTag] = useState("");
  const [selectedClanForEdit, setSelectedClanForEdit] = useState<any>(null);
  const [selectedClanForDelete, setSelectedClanForDelete] = useState<any>(null);
  const [selectedUserEmailForAssign, setSelectedUserEmailForAssign] = useState("");
  const [selectedClanTagForAssign, setSelectedClanTagForAssign] = useState("");
  const [selectedUserForView, setSelectedUserForView] = useState<any>(null);
  const [selectedUserForRoleEdit, setSelectedUserForRoleEdit] = useState<any>(null);
  const [newUserRole, setNewUserRole] = useState("user");

  // Estados para formulários
  const [newClanTag, setNewClanTag] = useState("");
  const [newClanName, setNewClanName] = useState("");
  const [editClanName, setEditClanName] = useState("");
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

  const filteredClans = allClans?.filter((clan: any) =>
    clan.name?.toLowerCase().includes(searchClan.toLowerCase()) ||
    clan.tag?.toLowerCase().includes(searchClan.toLowerCase())
  ) || [];

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

  // Clãs disponíveis para atribuir ao usuário selecionado
  const availableClansForUser = React.useMemo(() => {
    if (!selectedUserEmailForAssign) return allClans || [];
    
    const selectedUserData = allUsers?.find((u: any) => u.email === selectedUserEmailForAssign);
    if (!selectedUserData) return allClans || [];
    
    const userClanTags = (selectedUserData.clans || []).map((c: any) => c.tag?.toLowerCase());
    
    return (allClans || []).filter((clan: any) => {
      const clanTagLower = clan.tag?.toLowerCase();
      return !userClanTags.includes(clanTagLower);
    });
  }, [selectedUserEmailForAssign, allClans, allUsers]);

  // Clãs que o usuário selecionado já possui
  const userOwnedClans = React.useMemo(() => {
    if (!selectedUserEmailForAssign) return [];
    
    const selectedUserData = allUsers?.find((u: any) => u.email === selectedUserEmailForAssign);
    return selectedUserData?.clans || [];
  }, [selectedUserEmailForAssign, allUsers]);

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

  const handleCreateClan = async () => {
    if (!newClanTag.trim()) {
      showToast("error", "Preencha a tag do clã");
      return;
    }

    try {
      await createClanAdmin({ clanTag: newClanTag });
      showToast("success", "Clã criado com sucesso");
      setIsCreateClanDialogOpen(false);
      setNewClanTag("");
      setNewClanName("");
      refetchClans();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        showToast("error", error.message || "Erro ao criar clã");
      } else {
        showToast("error", "Erro ao criar clã");
      }
    }
  };

  const handleEditClan = async () => {
    if (!selectedClanForEdit || !editClanName.trim()) {
      showToast("error", "Preencha o nome do clã");
      return;
    }

    try {
      const cleanTag = selectedClanForEdit.tag.replace(/#|%23/g, "").trim();
      await apiFetch(`${import.meta.env.VITE_API_URL}/admin/update-clan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clanTag: cleanTag,
          clanName: editClanName.trim(),
        }),
      });

      showToast("success", "Clã atualizado com sucesso");
      setIsEditClanDialogOpen(false);
      setSelectedClanForEdit(null);
      setEditClanName("");
      refetchClans();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        showToast("error", error.message || "Erro ao atualizar clã");
      } else {
        showToast("error", "Erro ao atualizar clã");
      }
    }
  };

  const handleDeleteClan = async () => {
    if (!selectedClanForDelete) {
      return;
    }

    try {
      const cleanTag = selectedClanForDelete.tag.replace(/#|%23/g, "").trim();
      await apiFetch(`${import.meta.env.VITE_API_URL}/admin/delete-clan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clanTag: cleanTag,
        }),
      });

      showToast("success", "Clã deletado com sucesso");
      setIsDeleteClanDialogOpen(false);
      setSelectedClanForDelete(null);
      refetchClans();
      refetchUsers();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        showToast("error", error.message || "Erro ao deletar clã");
      } else {
        showToast("error", "Erro ao deletar clã");
      }
    }
  };

  const handleAssignClanToUser = async () => {
    if (!selectedUserEmailForAssign || !selectedClanTagForAssign) {
      showToast("error", "Selecione um usuário e um clã");
      return;
    }

    try {
      await addClanToUser({
        userEmail: selectedUserEmailForAssign,
        clanTag: selectedClanTagForAssign,
      });

      showToast("success", "Clã atribuído ao usuário com sucesso");
      setIsAssignClanDialogOpen(false);
      setSelectedUserEmailForAssign("");
      setSelectedClanTagForAssign("");
      refetchUsers();
      refetchClans();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        showToast("error", error.message || "Erro ao atribuir clã ao usuário");
      } else {
        showToast("error", "Erro ao atribuir clã ao usuário");
      }
    }
  };

  const handleRevokeAccess = async () => {
    if (!selectedUser || !selectedClanTag) {
      return;
    }

    try {
      await revokeClanAccess({
        userId: selectedUser,
        clanTag: selectedClanTag,
      });

      showToast("success", "Acesso revogado com sucesso");
      setIsRevokeDialogOpen(false);
      setSelectedUser(null);
      setSelectedClanTag("");
      refetchUsers();
      refetchClans();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        showToast("error", error.message || "Erro ao revogar acesso");
      } else {
        showToast("error", "Erro ao revogar acesso");
      }
    }
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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 space-y-6">
        {/* Toast Message */}
        {toastMessage && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg border-2 shadow-lg ${
              toastMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "success" ? (
                <Shield className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="font-medium">{toastMessage.message}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border-2 border-primary/20">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                Painel Administrativo
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie clãs, usuários e acessos do sistema
              </p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="dashboard" className="flex-shrink-0">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="clans" className="flex-shrink-0">
                <Shield className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Clãs</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-shrink-0">
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex-shrink-0">
                <BarChart3 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Estatísticas</span>
              </TabsTrigger>
              <TabsTrigger value="seasons" className="flex-shrink-0">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Temporadas</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Clãs</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalClans}</div>
                  <p className="text-xs text-muted-foreground">
                    {clansWithUsers} com usuários, {clansWithoutUsers} sem usuários
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalAdmins} administradores
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Atribuições</CardTitle>
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalClanAssignments}</div>
                  <p className="text-xs text-muted-foreground">
                    Clãs atribuídos a usuários
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Uso</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalClans > 0 ? Math.round((clansWithUsers / totalClans) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clãs em uso
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>Operações frequentes do painel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Dialog open={isCreateClanDialogOpen} onOpenChange={setIsCreateClanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Database className="w-4 h-4 mr-2" />
                        Criar Novo Clã
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="mx-4 sm:mx-auto">
                      <DialogHeader>
                        <DialogTitle>Criar Novo Clã</DialogTitle>
                        <DialogDescription>
                          Adicione um novo clã ao banco de dados
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="newClanTag">Tag do Clã *</Label>
                          <Input
                            id="newClanTag"
                            placeholder="#ABC123"
                            value={newClanTag}
                            onChange={(e) => setNewClanTag(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newClanName">Nome do Clã (opcional)</Label>
                          <Input
                            id="newClanName"
                            placeholder="Nome do clã"
                            value={newClanName}
                            onChange={(e) => setNewClanName(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCreateClanDialogOpen(false);
                            setNewClanTag("");
                            setNewClanName("");
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateClan}>
                          Criar Clã
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isAssignClanDialogOpen} onOpenChange={setIsAssignClanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Plus className="w-4 h-4 mr-2" />
                        Atribuir Clã a Usuário
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="mx-4 sm:mx-auto">
                      <DialogHeader>
                        <DialogTitle>Atribuir Clã a Usuário</DialogTitle>
                        <DialogDescription>
                          Selecione um usuário e um clã para atribuir
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="userSelect">Usuário *</Label>
                          <Select
                            value={selectedUserEmailForAssign}
                            onValueChange={(value) => {
                              setSelectedUserEmailForAssign(value);
                              setSelectedClanTagForAssign("");
                            }}
                          >
                            <SelectTrigger id="userSelect" className="w-full">
                              <SelectValue placeholder="Selecione um usuário" />
                            </SelectTrigger>
                            <SelectContent>
                              {allUsers && allUsers.length > 0 ? (
                                allUsers.map((user: any) => (
                                  <SelectItem key={user.id} value={user.email}>
                                    {user.email} {user.name ? `(${user.name})` : ""}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-users" disabled>
                                  Nenhum usuário encontrado
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedUserEmailForAssign && (
                          <>
                            {userOwnedClans.length > 0 && (
                              <div className="space-y-2">
                                <Label>Clãs já atribuídos a este usuário:</Label>
                                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                                  {userOwnedClans.map((clan: any) => (
                                    <span
                                      key={clan.tag}
                                      className="text-xs px-2 py-1 bg-background rounded-md font-mono border"
                                    >
                                      {clan.name} ({clan.tag})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label htmlFor="clanSelect">Clã Disponível *</Label>
                              <Select
                                value={selectedClanTagForAssign}
                                onValueChange={setSelectedClanTagForAssign}
                              >
                                <SelectTrigger id="clanSelect" className="w-full">
                                  <SelectValue placeholder="Selecione um clã disponível" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableClansForUser.length > 0 ? (
                                    availableClansForUser.map((clan: any) => (
                                      <SelectItem key={clan.tag} value={clan.tag}>
                                        {clan.name || "Sem nome"} ({clan.tag})
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="no-clans" disabled>
                                      Nenhum clã disponível (usuário já possui todos)
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAssignClanDialogOpen(false);
                            setSelectedUserEmailForAssign("");
                            setSelectedClanTagForAssign("");
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleAssignClanToUser}
                          disabled={!selectedUserEmailForAssign || !selectedClanTagForAssign}
                        >
                          Atribuir
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                  <CardDescription>Resumo das últimas operações</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{totalClans} clãs cadastrados</p>
                        <p className="text-xs text-muted-foreground">{clansWithUsers} em uso</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{totalUsers} usuários ativos</p>
                        <p className="text-xs text-muted-foreground">{totalAdmins} administradores</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Link2 className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{totalClanAssignments} atribuições</p>
                        <p className="text-xs text-muted-foreground">Clãs vinculados a usuários</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clãs Tab */}
          <TabsContent value="clans" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Gerenciar Clãs
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar clã..."
                  value={searchClan}
                  onChange={(e) => setSearchClan(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Nome</TableHead>
                    <TableHead className="min-w-[100px]">Tag</TableHead>
                    <TableHead className="min-w-[80px]">Usuários</TableHead>
                    <TableHead className="text-right min-w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum clã encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClans.map((clan: any) => {
                      const clanUsers = getClanUsers(clan.tag);
                      return (
                        <TableRow key={clan.tag}>
                        <TableCell className="font-medium">
                          <div className="min-w-0">
                            <p className="truncate">{clan.name || "Sem nome"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs sm:text-sm">
                          <div className="min-w-0">
                            <p className="truncate">{clan.tag}</p>
                          </div>
                        </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="text-sm">{clan.userCount || 0}</span>
                              {clanUsers.length > 0 && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                      onClick={() => setSelectedUserForView(null)}
                                    >
                                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl mx-4 sm:mx-auto">
                                    <DialogHeader>
                                      <DialogTitle>Usuários do Clã {clan.name || clan.tag}</DialogTitle>
                                      <DialogDescription>
                                        Lista de todos os usuários com acesso a este clã
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                      {clanUsers.map((user: any) => (
                                        <div
                                          key={user.id}
                                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg"
                                        >
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{user.name || "Sem nome"}</p>
                                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                          </div>
                                          <span
                                            className={`text-xs px-2 py-1 rounded-md font-medium flex-shrink-0 ${
                                              user.role === "admin"
                                                ? "bg-primary/20 text-primary"
                                                : "bg-muted text-muted-foreground"
                                            }`}
                                          >
                                            {user.role || "user"}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 sm:gap-2 flex-wrap">
                              <Dialog
                                open={isEditClanDialogOpen && selectedClanForEdit?.tag === clan.tag}
                                onOpenChange={(open) => {
                                  setIsEditClanDialogOpen(open);
                                  if (open) {
                                    setSelectedClanForEdit(clan);
                                    setEditClanName(clan.name || "");
                                  } else {
                                    setSelectedClanForEdit(null);
                                    setEditClanName("");
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="mx-4 sm:mx-auto">
                                  <DialogHeader>
                                    <DialogTitle>Editar Clã</DialogTitle>
                                    <DialogDescription>
                                      Atualize o nome do clã
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label>Tag do Clã</Label>
                                      <Input value={clan.tag} disabled />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="editClanName">Nome do Clã *</Label>
                                      <Input
                                        id="editClanName"
                                        placeholder="Nome do clã"
                                        value={editClanName}
                                        onChange={(e) => setEditClanName(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setIsEditClanDialogOpen(false);
                                        setSelectedClanForEdit(null);
                                        setEditClanName("");
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button onClick={handleEditClan} disabled={!editClanName.trim()}>
                                      Salvar
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <Dialog
                                open={isDeleteClanDialogOpen && selectedClanForDelete?.tag === clan.tag}
                                onOpenChange={(open) => {
                                  setIsDeleteClanDialogOpen(open);
                                  if (open) {
                                    setSelectedClanForDelete(clan);
                                  } else {
                                    setSelectedClanForDelete(null);
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="mx-4 sm:mx-auto">
                                  <DialogHeader>
                                    <DialogTitle>Deletar Clã</DialogTitle>
                                    <DialogDescription>
                                      Tem certeza que deseja deletar o clã {clan.name || clan.tag}?
                                      Esta ação não pode ser desfeita e removerá o acesso de todos os usuários.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setIsDeleteClanDialogOpen(false);
                                        setSelectedClanForDelete(null);
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={handleDeleteClan}
                                    >
                                      Deletar
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              </div>
            </div>
          </TabsContent>

          {/* Usuários Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Gerenciar Usuários
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Nome</TableHead>
                    <TableHead className="min-w-[150px]">Email</TableHead>
                    <TableHead className="min-w-[100px]">Clãs</TableHead>
                    <TableHead className="min-w-[70px]">Role</TableHead>
                    <TableHead className="text-right min-w-[120px]">Ações</TableHead>
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
                        <TableCell className="font-medium">
                          <div className="min-w-0 max-w-[120px] sm:max-w-none">
                            <p className="truncate">{user.name || "N/A"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs sm:text-sm">
                          <div className="min-w-0 max-w-[150px] sm:max-w-none">
                            <p className="truncate">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
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
                              <span className="text-muted-foreground">Nenhum</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-1 rounded-md font-medium ${
                              user.role === "admin"
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {user.role || "user"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 sm:gap-2 flex-wrap">
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
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl mx-4 sm:mx-auto">
                                <DialogHeader>
                                  <DialogTitle>Detalhes do Usuário</DialogTitle>
                                  <DialogDescription>
                                    Informações completas do usuário
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedUserForView && (
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label>Nome</Label>
                                      <p className="text-sm">{selectedUserForView.name || "N/A"}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Email</Label>
                                      <p className="text-sm font-mono">{selectedUserForView.email}</p>
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
                                              className="text-xs px-2 py-1 bg-background rounded-md font-mono border"
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
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <UserCog className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="mx-4 sm:mx-auto">
                                <DialogHeader>
                                  <DialogTitle>Editar Role do Usuário</DialogTitle>
                                  <DialogDescription>
                                    Altere a role/permissão do usuário
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Usuário</Label>
                                    <p className="text-sm">{user.email}</p>
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
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsEditUserRoleDialogOpen(false);
                                      setSelectedUserForRoleEdit(null);
                                      setNewUserRole("user");
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleUpdateUserRole}>
                                    Salvar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {user.clans && user.clans.length > 0 && (
                              <Dialog
                                open={isRevokeDialogOpen && selectedUser === user.id}
                                onOpenChange={(open) => {
                                  setIsRevokeDialogOpen(open);
                                  if (open) {
                                    setSelectedUser(user.id);
                                  } else {
                                    setSelectedUser(null);
                                    setSelectedClanTag("");
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="mx-4 sm:mx-auto">
                                  <DialogHeader>
                                    <DialogTitle>Revogar Acesso</DialogTitle>
                                    <DialogDescription>
                                      Selecione o clã do qual deseja revogar o acesso
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="clanSelect">Clã</Label>
                                      <Select
                                        value={selectedClanTag}
                                        onValueChange={setSelectedClanTag}
                                      >
                                        <SelectTrigger id="clanSelect" className="w-full">
                                          <SelectValue placeholder="Selecione um clã" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {user.clans?.map((clan: any) => (
                                            <SelectItem key={clan.tag} value={clan.tag}>
                                              {clan.name || "Sem nome"} ({clan.tag})
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setIsRevokeDialogOpen(false);
                                        setSelectedUser(null);
                                        setSelectedClanTag("");
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={handleRevokeAccess}
                                      disabled={!selectedClanTag}
                                    >
                                      Revogar Acesso
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
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
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Média de clãs por usuário</span>
                      <span className="text-2xl font-bold">
                        {totalUsers > 0 ? (totalClanAssignments / totalUsers).toFixed(1) : "0"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Usuários sem clãs</span>
                      <span className="text-2xl font-bold">
                        {allUsers?.filter((u: any) => !u.clans || u.clans.length === 0).length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Usuários com mais clãs</span>
                      <span className="text-2xl font-bold">
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
                        <div key={clan.tag} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                            <span className="text-sm font-medium">{clan.name || "Sem nome"}</span>
                            <span className="text-xs text-muted-foreground font-mono">{clan.tag}</span>
                          </div>
                          <span className="text-sm font-medium">{clan.userCount || 0} usuários</span>
                        </div>
                      )) || <p className="text-sm text-muted-foreground">Nenhum clã encontrado</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Seasons Tab */}
          <TabsContent value="seasons" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          className="flex items-center justify-between p-3 border rounded-lg"
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
                          >
                            <Trophy className="w-4 h-4 mr-2" />
                            {config.isProcessed ? "Já Processado" : "Executar Agora"}
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
