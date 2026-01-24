import { createFileRoute, redirect } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { useEffect, useState } from "react";
import React from "react";
import { Shield, Users, Plus, Search, Trash2, AlertCircle, Database } from "lucide-react";
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
// Toast simples usando state

const authQueryOptions = queryOptions({
  queryKey: ["session"],
  queryFn: () => apiFetch(`${import.meta.env.VITE_API_URL}/auth/get-session`),
});

const allClansQueryOptions = queryOptions({
  queryKey: ["admin-all-clans"],
  queryFn: () => apiFetch(`${import.meta.env.VITE_API_URL}/admin/clans`),
});

const allUsersQueryOptions = queryOptions({
  queryKey: ["admin-all-users"],
  queryFn: () => apiFetch(`${import.meta.env.VITE_API_URL}/admin/users`),
});

export const Route = createFileRoute("/(private)/admin/")({
  loader: async ({ context: { queryClient } }) => {
    try {
      const session = await queryClient.ensureQueryData(authQueryOptions);
      
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
        queryClient.ensureQueryData(allClansQueryOptions),
        queryClient.ensureQueryData(allUsersQueryOptions),
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
      throw error;
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data: session } = useSuspenseQuery(authQueryOptions);
  const { data: allClans, refetch: refetchClans } = useSuspenseQuery(allClansQueryOptions);
  const { data: allUsers, refetch: refetchUsers } = useSuspenseQuery(allUsersQueryOptions);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [searchClan, setSearchClan] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [isCreateClanDialogOpen, setIsCreateClanDialogOpen] = useState(false);
  const [isAssignClanDialogOpen, setIsAssignClanDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedClanTag, setSelectedClanTag] = useState("");
  const [selectedUserEmailForAssign, setSelectedUserEmailForAssign] = useState("");
  const [selectedClanTagForAssign, setSelectedClanTagForAssign] = useState("");
  const [newClanTag, setNewClanTag] = useState("");

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

  // Clãs disponíveis para atribuir ao usuário selecionado (excluindo os que ele já possui)
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

  const handleCreateClan = async () => {
    if (!newClanTag.trim()) {
      setToastMessage({ type: "error", message: "Preencha a tag do clã" });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    try {
      const cleanTag = newClanTag.replace(/#|%23/g, "").trim();
      await apiFetch(`${import.meta.env.VITE_API_URL}/admin/create-clan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clanTag: cleanTag,
        }),
      });

      setToastMessage({ type: "success", message: "Clã criado com sucesso" });
      setTimeout(() => setToastMessage(null), 3000);

      setIsCreateClanDialogOpen(false);
      setNewClanTag("");
      refetchClans();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setToastMessage({ type: "error", message: error.message || "Erro ao criar clã" });
        setTimeout(() => setToastMessage(null), 3000);
      }
    }
  };

  const handleAssignClanToUser = async () => {
    if (!selectedUserEmailForAssign || !selectedClanTagForAssign) {
      setToastMessage({ type: "error", message: "Selecione um usuário e um clã" });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    try {
      const cleanTag = selectedClanTagForAssign.replace(/#|%23/g, "").trim();
      await apiFetch(`${import.meta.env.VITE_API_URL}/admin/add-clan-to-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: selectedUserEmailForAssign,
          clanTag: cleanTag,
        }),
      });

      setToastMessage({ type: "success", message: "Clã atribuído ao usuário com sucesso" });
      setTimeout(() => setToastMessage(null), 3000);

      setIsAssignClanDialogOpen(false);
      setSelectedUserEmailForAssign("");
      setSelectedClanTagForAssign("");
      refetchUsers();
      refetchClans();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setToastMessage({ type: "error", message: error.message || "Erro ao atribuir clã ao usuário" });
        setTimeout(() => setToastMessage(null), 3000);
      }
    }
  };

  const handleRevokeAccess = async () => {
    if (!selectedUser || !selectedClanTag) {
      return;
    }

    try {
      const cleanTag = selectedClanTag.replace(/#|%23/g, "").trim();
      await apiFetch(`${import.meta.env.VITE_API_URL}/admin/revoke-clan-access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser,
          clanTag: cleanTag,
        }),
      });

      setToastMessage({ type: "success", message: "Acesso revogado com sucesso" });
      setTimeout(() => setToastMessage(null), 3000);

      setIsRevokeDialogOpen(false);
      setSelectedUser(null);
      setSelectedClanTag("");
      refetchUsers();
      refetchClans();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setToastMessage({ type: "error", message: error.message || "Erro ao revogar acesso" });
        setTimeout(() => setToastMessage(null), 3000);
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
                Gerencie clãs e acessos de usuários
              </p>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total de Clãs
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {allClans?.length || 0}
                </p>
              </div>
              <Shield className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total de Usuários
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {allUsers?.length || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Ações Rápidas
                </p>
                <div className="flex flex-col gap-2">
                  <Dialog open={isCreateClanDialogOpen} onOpenChange={setIsCreateClanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Database className="w-4 h-4 mr-2" />
                        Criar Clã
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCreateClanDialogOpen(false);
                            setNewClanTag("");
               
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
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Atribuir Clã
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                                      {clan.name} 
                                      ({clan.tag})
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
                </div>
              </div>
              <Plus className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>
        </div>

        {/* Clãs Cadastrados */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Todos os Clãs Cadastrados
            </h2>
            <div className="relative w-64">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
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
                  filteredClans.map((clan: any) => (
                    <TableRow key={clan.tag}>
                      <TableCell className="font-medium">{clan.name}</TableCell>
                      <TableCell className="font-mono text-sm">{clan.tag}</TableCell>
                      <TableCell>{clan.userCount || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Ver usuários do clã
                          }}
                        >
                          Ver Usuários
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Usuários */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Todos os Usuários
            </h2>
            <div className="relative w-64">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Clãs</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
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
                      <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                      <TableCell className="font-mono text-sm">{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.clans?.map((clan: any) => (
                            <span
                              key={clan.tag}
                              className="text-xs px-2 py-1 bg-muted rounded-md font-mono"
                            >
                              {clan.name}
                            </span>
                          )) || <span className="text-muted-foreground">Nenhum</span>}
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
                        {user.clans && user.clans.length > 0 && (
                          <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Revogar Acesso
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
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
                                          {clan.name} ({clan.tag})
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}
