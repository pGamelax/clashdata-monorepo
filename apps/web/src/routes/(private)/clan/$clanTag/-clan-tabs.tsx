import { Link, useLocation } from "@tanstack/react-router";
import { ChartSpline, Shield, Sword, Home, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClanTabsProps {
  clanTag: string;
}

export function ClanTabs({ clanTag }: ClanTabsProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const basePath = `/clan/${clanTag}`;
  
  const tabs = [
    {
      value: "index",
      path: basePath,
      label: "Geral",
      icon: Home,
      mobileLabel: "Geral",
    },
    {
      value: "current",
      path: `${basePath}/current`,
      label: "Guerra Atual",
      icon: Sword,
      mobileLabel: "Atual",
    },
    {
      value: "history",
      path: `${basePath}/history`,
      label: "Histórico",
      icon: History,
      mobileLabel: "Histórico",
    },
    {
      value: "normal",
      path: `${basePath}/normal`,
      label: "Guerras Normais",
      icon: ChartSpline,
      mobileLabel: "Normais",
    },
    {
      value: "cwl",
      path: `${basePath}/cwl`,
      label: "Liga de Clãs (CWL)",
      icon: Shield,
      mobileLabel: "CWL",
    },
  ];

  const isActive = (tabPath: string) => {
    if (tabPath === basePath) {
      return currentPath === basePath || currentPath === `${basePath}/`;
    }
    return currentPath.startsWith(tabPath);
  };

  return (
    <div className="mb-4 w-full border border-border/50 rounded-lg bg-muted/50 p-1">
      <div className="grid w-full grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          
          return (
            <Link
              key={tab.value}
              to={tab.path as any}
              preload="intent"
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-1 rounded-md border border-transparent text-[10px] xs:text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 px-1 sm:px-2 py-1.5 sm:py-2 min-w-0",
                active
                  ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 pointer-events-none" />
              <span className="hidden xs:inline sm:hidden truncate max-w-full">{tab.mobileLabel}</span>
              <span className="hidden sm:inline truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

