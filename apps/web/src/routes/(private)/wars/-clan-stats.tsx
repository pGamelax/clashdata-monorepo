import { Trophy, Sword, Swords, TrendingUp, type LucideIcon } from "lucide-react";

interface StatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

interface ClanStatsProps {
  warWins: number;
  warLosses: number;
}

export function ClanStats({ warWins, warLosses }: ClanStatsProps) {
  const stats: StatItem[] = [
    {
      label: "Vitórias",
      value: warWins,
      icon: Trophy,
      color: "text-amber-500",
    },
    {
      label: "Derrotas",
      value: warLosses,
      icon: Sword,
      color: "text-rose-500",
    },
    {
      label: "Total de Guerras",
      value: warWins + (warLosses || 0),
      icon: Swords,
      color: "text-indigo-500",
    },
    {
      label: "Taxa de Vitória",
      value:
        warWins + warLosses > 0
          ? `${((warWins / (warWins + warLosses)) * 100).toFixed(1)}%`
          : "0%",
      icon: TrendingUp,
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="bg-card border border-border rounded-lg p-3 sm:p-4 flex flex-col items-start justify-between"
          >
            <div className={`mb-2 ${stat.color}`}>
              <Icon size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="w-full">
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                {stat.label}
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-foreground">
                {stat.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

