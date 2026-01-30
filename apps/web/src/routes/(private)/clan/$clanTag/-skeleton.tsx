import { Skeleton } from "@/components/ui/skeleton";

export function ClanPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* Header Skeleton */}
        <div className="bg-card border border-border rounded-xl p-5 sm:p-6 lg:p-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start sm:items-end gap-4 sm:gap-5 flex-wrap">
              <Skeleton className="h-8 sm:h-10 w-48 sm:w-64" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-4 w-full max-w-2xl" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-3 sm:p-4"
            >
              <Skeleton className="h-5 w-5 mb-2" />
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="grid grid-cols-4 border border-border/50 rounded-lg bg-muted/50 p-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CurrentWarSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WarsTableSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

