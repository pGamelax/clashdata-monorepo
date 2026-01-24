import { Skeleton } from "@/components/ui/skeleton";

export function LegendLogsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* Header Skeleton */}
        <div className="bg-card border border-border rounded-xl p-5 sm:p-6 lg:p-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start sm:items-end gap-4 sm:gap-5 flex-wrap">
              <Skeleton className="h-8 sm:h-10 w-64" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-7 w-32" />
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 lg:p-6">
            <div className="space-y-4">
              <Skeleton className="h-11 w-64" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


