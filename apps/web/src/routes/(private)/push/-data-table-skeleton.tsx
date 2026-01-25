import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DataTableSkeleton() {
  return (
    <div className="space-y-4 w-full max-w-[100vw] overflow-hidden px-1 sm:px-0">
      {/* Tabs skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-lg" />
        ))}
      </div>

      {/* Search skeleton */}
      <div className="flex flex-col gap-4 px-2 lg:flex-row lg:justify-between lg:items-center">
        <Skeleton className="h-11 w-64 rounded-lg" />
      </div>

      {/* Table skeleton */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50 border-b border-border">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              {[...Array(6)].map((_, i) => (
                <TableHead key={i} className="py-4">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i} className="border-b border-border">
                <TableCell className="py-4 pl-6">
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                {[...Array(6)].map((_, j) => (
                  <TableCell key={j} className="py-4">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards skeleton */}
      <div className="md:hidden space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-4 space-y-3"
          >
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

