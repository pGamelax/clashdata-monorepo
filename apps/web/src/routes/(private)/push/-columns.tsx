import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Plus, Minus } from "lucide-react";

export interface PlayerDayLog {
  playerTag: string;
  playerName: string;
  gain: number;
  gainCount: number;
  loss: number;
  lossCount: number;
  final: number;
  logs: Array<{
    id: number;
    type: "ATTACK" | "DEFENSE";
    diff: number;
    trophiesResult: number;
    timestamp: string;
  }>;
}

// Função para formatar número com superscript
const formatWithSuperscript = ( value: number, count: number): string => {
  const superscript = count.toString();
  const superscriptMap: Record<string, string> = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", 
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹"
  };
  const superscriptStr = superscript.split("").map(d => superscriptMap[d] || d).join("");
  return `${Math.abs(value)}${superscriptStr}`;
};

export const columns: ColumnDef<PlayerDayLog>[] = [
  {
    accessorKey: "playerName",
    header: "NAME",
    cell: ({ row }) => {
      const playerTag = row.original.playerTag.replace("#", "");
      return (
        <Link
          to="/players/$playerTag"
          params={{ playerTag }}
          search={{ error: undefined }}
          className="font-medium hover:text-primary transition-colors cursor-pointer"
        >
          {row.original.playerName}
        </Link>
      );
    },
  },
  {
    accessorKey: "gain",
    header: "GAIN",
    cell: ({ row }) => {
      const gain = row.original.gain;
      const count = row.original.gainCount;
      return (
        <div className="flex items-center gap-1 font-semibold text-green-500">
          <Plus className="w-3 h-3" />
          <span>{formatWithSuperscript( gain, count)}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "loss",
    header: "LOSS",
    cell: ({ row }) => {
      const loss = row.original.loss;
      const count = row.original.lossCount;
      return (
        <div className="flex items-center gap-1 font-semibold text-red-500">
          <Minus className="w-3 h-3" />
          <span>{formatWithSuperscript( loss, count)}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "final",
    header: "FINAL",
    cell: ({ row }) => (
      <span className="font-semibold">{row.original.final.toLocaleString()}</span>
    ),
  },
];
