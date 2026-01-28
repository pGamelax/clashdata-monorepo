import { useState } from "react";
import { Database } from "lucide-react";
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
import { ApiError, createClanAdmin } from "@/api";

interface CreateClanDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  showToast: (type: "success" | "error", message: string) => void;
}

export function CreateClanDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  showToast,
}: CreateClanDialogProps) {
  const [newClanTag, setNewClanTag] = useState("");

  const handleCreateClan = async () => {
    if (!newClanTag.trim()) {
      showToast("error", "Preencha a tag do clã");
      return;
    }

    try {
      await createClanAdmin({ clanTag: newClanTag });
      showToast("success", "Clã criado com sucesso");
      setNewClanTag("");
      onSuccess();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        showToast("error", error.message || "Erro ao criar clã");
      } else {
        showToast("error", "Erro ao criar clã");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Database className="w-4 h-4" />
          Criar Clã
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
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
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
  );
}
