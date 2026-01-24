import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

// Tipagem para os ataques detalhados
export interface WarAttack {
  stars: number;
  destructionPercentage: number;
}


export interface ClanWar {
  id: string;
  date: string;
  clanName: string;
  opponentName: string;
  result: "Vitória" | "Derrota" | "Empate";
  stars: number;
  destruction: number;
  type: string;
  rawAttacks: WarAttack[]; 
}

export const columns: ColumnDef<ClanWar>[] = [
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.date}</span>
    ),
  },
  {
    accessorKey: "clanName",
    header: "Clan",
    cell: ({ row }) => (
      <span className="font-bold">{row.original.clanName}</span>
    ),
  },
  {
    accessorKey: "result",
    header: "Resultado",
    cell: ({ row }) => {
      const result = row.original.result;
      const styles = {
        Vitória: "bg-emerald-500/10 text-emerald-600 border-none",
        Derrota: "bg-red-500/10 text-red-600 border-none",
        Empate: "bg-amber-500/10 text-amber-600 border-none",
      };

      return <Badge className={styles[result]}>{result}</Badge>;
    },
  },
  {
    accessorKey: "stars",
    header: "Estrelas",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <span className="font-bold">{row.original.stars}</span>
        <Star size={12} className="fill-amber-400 text-amber-400" />
      </div>
    ),
  },
  {
    accessorKey: "destruction",
    header: "Destruição",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.destruction}%</span>
    ),
  },
];
