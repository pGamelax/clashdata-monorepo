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
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Buscar e Atribuir Clã</span>
          <span className="sm:hidden">Buscar Clã</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Buscar e Atribuir Clã</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Busque um clã pela tag e atribua a um usuário
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clanTagSearch" className="text-xs sm:text-sm">Tag do Clã *</Label>
            <div className="flex flex-col sm:flex-row gap-2">
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
                className="flex-1 text-sm sm:text-base h-9 sm:h-10"
              />
              <Button 
                onClick={handleSearchClan} 
                disabled={isSearching || !clanTag.trim()} 
                className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                    <span className="hidden sm:inline">Buscando...</span>
                    <span className="sm:hidden">Buscando</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </div>

          {clanInfo && (
            <Card className="border-2">
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-2 sm:gap-4">
                    {clanInfo.badgeUrls?.small && (
                      <img
                        src={clanInfo.badgeUrls.small}
                        alt={clanInfo.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-lg break-words">{clanInfo.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground font-mono break-all mt-0.5">{clanInfo.tag}</p>
                      {clanInfo.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2 break-words line-clamp-2">{clanInfo.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
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
              <Label htmlFor="userSelectForClan" className="text-xs sm:text-sm">Selecione o Usuário *</Label>
              <Select
                value={selectedUserEmail}
                onValueChange={setSelectedUserEmail}
              >
                <SelectTrigger id="userSelectForClan" className="w-full h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] sm:max-h-[300px]">
                  {allUsers && allUsers.length > 0 ? (
                    allUsers.map((user: any) => (
                      <SelectItem key={user.id} value={user.email} className="text-xs sm:text-sm">
                        <span className="truncate block">
                          {user.email} {user.name ? `(${user.name})` : ""}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-users" disabled className="text-xs sm:text-sm">
                      Nenhum usuário encontrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 sm:pt-0">
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              setClanTag("");
              setClanInfo(null);
              setSelectedUserEmail("");
            }}
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm order-2 sm:order-1"
          >
            Cancelar
          </Button>
          {clanInfo && (
            <Button
              onClick={handleConfirm}
              disabled={!selectedUserEmail || isConfirming}
              className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm order-1 sm:order-2"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Atribuindo...</span>
                  <span className="sm:hidden">Atribuindo</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Confirmar e Atribuir</span>
                  <span className="sm:hidden">Confirmar</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
