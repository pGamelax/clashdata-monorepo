import { Skeleton } from "@/components/ui/skeleton";

export function WarsLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="container mx-auto px-4 py-6 lg:py-10 space-y-8">
        {/* Header Skeleton */}
        <div className="relative overflow-hidden bg-card/80 backdrop-blur-sm p-8 lg:p-10 rounded-3xl border-2 border-border/50 shadow-2xl">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64 rounded-xl" />
            <Skeleton className="h-6 w-96 rounded-lg" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm shadow-lg"
            >
              <Skeleton className="h-12 w-12 rounded-xl mb-4" />
              <Skeleton className="h-4 w-24 mb-2 rounded-lg" />
              <Skeleton className="h-10 w-20 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 px-2">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 rounded-lg" />
              <Skeleton className="h-4 w-48 rounded-lg" />
            </div>
          </div>
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border/50 shadow-xl p-6">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
