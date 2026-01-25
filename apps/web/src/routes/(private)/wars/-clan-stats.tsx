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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-4 sm:p-5"
          >
            <div className={`mb-3 ${stat.color}`}>
              <Icon size={20} className="sm:w-6 sm:h-6" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
              {stat.label}
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

