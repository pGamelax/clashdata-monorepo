import type { ColumnDef } from "@tanstack/react-table";
import {
  Star,
  Shield,
  Trophy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SwordsIcon,
} from "lucide-react";
import type { ProcessedPlayer } from "./-types"
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

const SortButton = ({ column, label }: { column: any; label: string }) => {
  const isSorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      {isSorted === "asc" && <ArrowUp className="ml-2 h-3 w-3 text-primary" />}
      {isSorted === "desc" && (
        <ArrowDown className="ml-2 h-3 w-3 text-primary" />
      )}
      {!isSorted && <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />}
    </Button>
  );
};

export const columns: ColumnDef<ProcessedPlayer>[] = [
  {
    id: "rank",
    header: "#",
    cell: ({ row }) => {
      const rank = row.index + 1;
      if (rank === 1) return <Trophy size={18} className="text-amber-500" />;
      if (rank === 2) return <Trophy size={18} className="text-slate-400" />;
      if (rank === 3) return <Trophy size={18} className="text-amber-700" />;
      return (
        <span className="text-sm font-mono text-muted-foreground">{rank}</span>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => <SortButton column={column} label="JOGADOR" />,
    cell: ({ row }) => {
      const playerTag = row.original.tag.replace("#", "");
      return (
        <Link
          to="/players/$playerTag"
          params={{ playerTag }}
          search={{ error: undefined }}
          className="flex flex-col text-base hover:text-primary transition-colors cursor-pointer"
        >
        <span className="font-semibold tracking-tight">
          {row.original.name}
        </span>
        <span className=" text-muted-foreground font-mono">
          {row.original.tag}
        </span>
        </Link>
      );
    },
  },
  {
    accessorKey: "performanceScore",
    header: ({ column }) => <SortButton column={column} label="EFICIÊNCIA" />,
    cell: ({ row }) => {
      const score = row.original.performanceScore;
      const progress = (score / 3) * 100;

 
      return (
        <div className="flex flex-col w-32 gap-1 text-base">
          <div className="flex justify-between items-center">
            <span className=" font-semibold text-primary">
              {score.toFixed(2)} pts
            </span>
          
            <span className="uppercase text-muted-foreground text-base">
              {row.original.totalPts} PT
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                progress > 80 ? "bg-primary" : "bg-primary"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "avgStars",
    header: ({ column }) => <SortButton column={column} label="MÉDIA ATAQUE" />,
    cell: ({ row }) => (
      <div className="flex flex-col text-base">
        <div className="flex items-center gap-1 font-semibold">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          {row.original.avgStars}
        </div>
        <span className="text-muted-foreground">
          {row.original.avgDestruction}% destruição
        </span>
      </div>
    ),
  },
  {
    accessorKey: "avgDefenseStars",
    header: ({ column }) => <SortButton column={column} label="MÉDIA DEFESA" />,
    cell: ({ row }) => (
      <div className="flex flex-col text-base">
        <div className="flex items-center gap-1 font-semibold">
          <Shield size={12} className="text-blue-500 fill-blue-500" />
          {row.original.avgDefenseStars}
        </div>
        <span className="text-muted-foreground">
          {row.original.avgDefenseDestruction}% destruição
        </span>
      </div>
    ),
  },

  {
    accessorKey: "warCount",
    header: ({ column }) => <SortButton column={column} label="PARTICIPAÇÃO" />,
    cell: ({ row }) => {
      const wars = row.original.warCount;
      const attacks = row.original.attackCount;

      const maxPossibleAttacks = wars * 2;

      return (
        <div className="flex flex-col text-base min-w-25">
          <div className="flex items-center gap-2">
            <SwordsIcon size={12} className="text-green-500 fill-green-500" />
            <span className="font-semibold">
             {row.original.warCount} Guerras
            </span>
         
          </div>
          <div>
         
          <span className="uppercase font-semibold text-sm text-muted-foreground">
              {attacks}/{maxPossibleAttacks} Atq
            </span>
          </div>
        </div>
      );
    },
  },
];
