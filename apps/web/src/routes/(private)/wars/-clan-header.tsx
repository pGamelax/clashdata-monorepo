import { Shield } from "lucide-react";

interface ClanHeaderProps {
  clanName: string;
  clanTag: string;
  description: string;
}

export function ClanHeader({ clanName, clanTag, description }: ClanHeaderProps) {
  return (
    <header className="bg-card border border-border rounded-xl p-5 sm:p-6 lg:p-8">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-start sm:items-end gap-4 sm:gap-5 flex-wrap">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground flex-1 min-w-0">
            <span className="truncate block">{clanName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground bg-muted rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 border border-border font-mono whitespace-nowrap font-medium">
            #{clanTag.replace("%23", "")}
          </p>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl line-clamp-2 sm:line-clamp-none">
          {description}
        </p>
      </div>
    </header>
  );
}

