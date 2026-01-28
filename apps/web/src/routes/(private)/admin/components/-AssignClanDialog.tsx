import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ApiError, addClanToUser } from "@/api";

interface AssignClanDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  allUsers: any[];
  allClans: any[];
  onSuccess: () => void;
  showToast: (type: "success" | "error", message: string) => void;
}

export function AssignClanDialog({
  isOpen,
  onOpenChange,
  allUsers,
  allClans,
  onSuccess,
  showToast,
}: AssignClanDialogProps) {
  const [selectedUserEmailForAssign, setSelectedUserEmailForAssign] = useState("");
  const [selectedClanTagForAssign, setSelectedClanTagForAssign] = useState("");

  const availableClansForUser = useMemo(() => {
    if (!selectedUserEmailForAssign) return allClans || [];
    
    const selectedUserData = allUsers?.find((u: any) => u.email === selectedUserEmailForAssign);
    if (!selectedUserData) return allClans || [];
    
    const userClanTags = (selectedUserData.clans || []).map((c: any) => c.tag?.toLowerCase());
    
    return (allClans || []).filter((clan: any) => {
      const clanTagLower = clan.tag?.toLowerCase();
      return !userClanTags.includes(clanTagLower);
    });
  }, [selectedUserEmailForAssign, allClans, allUsers]);

  const userOwnedClans = useMemo(() => {
    if (!selectedUserEmailForAssign) return [];
    
    const selectedUserData = allUsers?.find((u: any) => u.email === selectedUserEmailForAssign);
    return selectedUserData?.clans || [];
  }, [selectedUserEmailForAssign, allUsers]);

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
      setSelectedUserEmailForAssign("");
      setSelectedClanTagForAssign("");
      onSuccess();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        showToast("error", error.message || "Erro ao atribuir clã ao usuário");
      } else {
        showToast("error", "Erro ao atribuir clã ao usuário");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Atribuir Clã
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
              onOpenChange(false);
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
  );
}
