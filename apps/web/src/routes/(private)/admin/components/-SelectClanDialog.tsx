import { useState } from "react";
import { Search, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent } from "@/components/ui/card";

interface SelectClanDialogProps {
  allUsers: any[];
  allClans: any[];
  onSuccess: () => void;
  showToast: (type: "success" | "error", message: string) => void;
}

interface ClanInfo {
  tag: string;
  name: string;
  description?: string;
  memberCount?: number;
  clanLevel?: number;
  badgeUrls?: {
    small?: string;
    medium?: string;
    large?: string;
  };
}

export function SelectClanDialog({
  allUsers,
  onSuccess,
  showToast,
}: SelectClanDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [clanTag, setClanTag] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [clanInfo, setClanInfo] = useState<ClanInfo | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSearchClan = async () => {
    if (!clanTag.trim()) {
      showToast("error", "Digite a tag do clã");
      return;
    }

    setIsSearching(true);
    setClanInfo(null);

    try {
      const normalizedTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/search-clan?clanTag=${encodeURIComponent(normalizedTag)}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 404) {
          showToast("error", error.message || "Clã não encontrado na API da Supercell");
        } else {
          showToast("error", error.message || "Erro ao buscar clã");
        }
        return;
      }

      const data = await response.json();
      setClanInfo({
        tag: data.tag,
        name: data.name,
        description: data.description,
        memberCount: data.members,
        clanLevel: data.clanLevel,
        badgeUrls: data.badgeUrls,
      });
    } catch (error) {
      showToast("error", "Erro ao buscar clã na API");
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = async () => {
    if (!clanInfo || !selectedUserEmail) {
      showToast("error", "Selecione um usuário");
      return;
    }

    setIsConfirming(true);

    try {
      await addClanToUser({
        userEmail: selectedUserEmail,
        clanTag: clanInfo.tag,
      });

      showToast("success", "Clã atribuído ao usuário com sucesso");
      setIsOpen(false);
      setClanTag("");
      setClanInfo(null);
      setSelectedUserEmail("");
      onSuccess();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        showToast("error", error.message || "Erro ao atribuir clã ao usuário");
      } else {
        showToast("error", "Erro ao atribuir clã ao usuário");
      }
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Search className="w-4 h-4" />
          Buscar e Atribuir Clã
        </Button>
      </DialogTrigger>
      <DialogContent className="mx-4 sm:mx-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buscar e Atribuir Clã</DialogTitle>
          <DialogDescription>
            Busque um clã pela tag e atribua a um usuário
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="clanTagSearch">Tag do Clã *</Label>
            <div className="flex gap-2">
              <Input
                id="clanTagSearch"
                placeholder="#ABC123"
                value={clanTag}
                onChange={(e) => setClanTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isSearching) {
                    handleSearchClan();
                  }
                }}
              />
              <Button onClick={handleSearchClan} disabled={isSearching || !clanTag.trim()}>
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </div>

          {clanInfo && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    {clanInfo.badgeUrls?.small && (
                      <img
                        src={clanInfo.badgeUrls.small}
                        alt={clanInfo.name}
                        className="w-16 h-16"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{clanInfo.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{clanInfo.tag}</p>
                      {clanInfo.description && (
                        <p className="text-sm text-muted-foreground mt-2">{clanInfo.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm">
                        {clanInfo.clanLevel && (
                          <span className="text-muted-foreground">
                            Nível {clanInfo.clanLevel}
                          </span>
                        )}
                        {clanInfo.memberCount !== undefined && (
                          <span className="text-muted-foreground">
                            {clanInfo.memberCount} membros
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {clanInfo && (
            <div className="space-y-2">
              <Label htmlFor="userSelectForClan">Selecione o Usuário *</Label>
              <Select
                value={selectedUserEmail}
                onValueChange={setSelectedUserEmail}
              >
                <SelectTrigger id="userSelectForClan" className="w-full">
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
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              setClanTag("");
              setClanInfo(null);
              setSelectedUserEmail("");
            }}
          >
            Cancelar
          </Button>
          {clanInfo && (
            <Button
              onClick={handleConfirm}
              disabled={!selectedUserEmail || isConfirming}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Atribuindo...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar e Atribuir
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
