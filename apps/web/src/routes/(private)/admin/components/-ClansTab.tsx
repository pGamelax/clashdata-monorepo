import { useState } from "react";
import { Shield, Search, Trash2, Eye, X } from "lucide-react";
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
import { ApiError, revokeClanAccess } from "@/api";
import { SelectClanDialog } from "./SelectClanDialog";

interface ClansTabProps {
  allClans: any[];
  allUsers: any[];
  searchClan: string;
  setSearchClan: (value: string) => void;
  refetchClans: () => void;
  refetchUsers: () => void;
  showToast: (type: "success" | "error", message: string) => void;
  getClanUsers: (clanTag: string) => any[];
}

export function ClansTab({
  allClans,
  allUsers,
  searchClan,
  setSearchClan,
  refetchClans,
  refetchUsers,
  showToast,
  getClanUsers,
}: ClansTabProps) {
  const [isDeleteClanDialogOpen, setIsDeleteClanDialogOpen] = useState(false);
  const [selectedClanForDelete, setSelectedClanForDelete] = useState<any>(null);
  const [selectedClanForView, setSelectedClanForView] = useState<any>(null);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [selectedUserForRevoke, setSelectedUserForRevoke] = useState<any>(null);
  const [selectedClanTagForRevoke, setSelectedClanTagForRevoke] = useState("");

  const filteredClans = allClans?.filter((clan: any) =>
    clan.name?.toLowerCase().includes(searchClan.toLowerCase()) ||
    clan.tag?.toLowerCase().includes(searchClan.toLowerCase())
  ) || [];

  const handleDeleteClan = async () => {
    if (!selectedClanForDelete) {
      return;
    }

    try {
      const cleanTag = selectedClanForDelete.tag.replace(/#|%23/g, "").trim();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/delete-clan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          clanTag: cleanTag,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(error.message || "Erro ao deletar clã", response.status);
      }

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

  const handleRevokeAccess = async () => {
    if (!selectedUserForRevoke || !selectedClanTagForRevoke) {
      return;
    }

    try {
      await revokeClanAccess({
        userId: selectedUserForRevoke.id,
        clanTag: selectedClanTagForRevoke,
      });

      showToast("success", "Acesso revogado com sucesso");
      setIsRevokeDialogOpen(false);
      setSelectedUserForRevoke(null);
      setSelectedClanTagForRevoke("");
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary flex-shrink-0" />
            <span>Gerenciar Clãs</span>
          </h2>
          <SelectClanDialog
            allUsers={allUsers}
            onSuccess={() => {
              refetchUsers();
              refetchClans();
            }}
            showToast={showToast}
          />
        </div>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clã..."
            value={searchClan}
            onChange={(e) => setSearchClan(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm">Nome</TableHead>
                <TableHead className="min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm">Tag</TableHead>
                <TableHead className="min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm">Usuários</TableHead>
                <TableHead className="text-right min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm">Ações</TableHead>
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
                      <TableCell className="font-medium text-xs sm:text-sm">
                        <div className="min-w-0">
                          <p className="truncate">{clan.name || "Sem nome"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] sm:text-xs">
                        <div className="min-w-0">
                          <p className="truncate">{clan.tag}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="text-xs sm:text-sm">{clan.userCount || 0}</span>
                          {clanUsers.length > 0 && (
                            <Dialog
                              open={selectedClanForView?.tag === clan.tag}
                              onOpenChange={(open) => {
                                if (open) {
                                  setSelectedClanForView(clan);
                                } else {
                                  setSelectedClanForView(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-base sm:text-lg">Usuários do Clã {clan.name || clan.tag}</DialogTitle>
                                  <DialogDescription className="text-xs sm:text-sm">
                                    Lista de todos os usuários com acesso a este clã
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                  {clanUsers.map((user: any) => (
                                    <div
                                      key={user.id}
                                      className="flex flex-col gap-2 p-3 border rounded-lg"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm break-words">{user.name || "Sem nome"}</p>
                                          <p className="text-xs text-muted-foreground break-all">{user.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <span
                                            className={`text-xs px-2 py-1 rounded-md font-medium ${
                                              user.role === "admin"
                                                ? "bg-primary/20 text-primary"
                                                : "bg-muted text-muted-foreground"
                                            }`}
                                          >
                                            {user.role || "user"}
                                          </span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                            onClick={() => {
                                              setSelectedUserForRevoke(user);
                                              setSelectedClanTagForRevoke(clan.tag);
                                              setIsRevokeDialogOpen(true);
                                            }}
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
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
                              <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="mx-2 sm:mx-auto">
                              <DialogHeader>
                                <DialogTitle className="text-base sm:text-lg">Deletar Clã</DialogTitle>
                                <DialogDescription className="text-xs sm:text-sm">
                                  Tem certeza que deseja deletar o clã {clan.name || clan.tag}?
                                  Esta ação não pode ser desfeita e removerá o acesso de todos os usuários.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="flex-col sm:flex-row gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setIsDeleteClanDialogOpen(false);
                                    setSelectedClanForDelete(null);
                                  }}
                                  className="w-full sm:w-auto"
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleDeleteClan}
                                  className="w-full sm:w-auto"
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

      {/* Dialog para revogar acesso */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent className="mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Revogar Acesso</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm break-words">
              Tem certeza que deseja revogar o acesso de {selectedUserForRevoke?.email} ao clã {selectedClanTagForRevoke}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRevokeDialogOpen(false);
                setSelectedUserForRevoke(null);
                setSelectedClanTagForRevoke("");
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeAccess}
              className="w-full sm:w-auto"
            >
              Revogar Acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
