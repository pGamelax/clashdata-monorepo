import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { handleClanErrorWithRedirect } from "@/lib/clan-error-handler";
import { getClanInfoQueryOptions } from "@/api";
import { ClanHeader } from "@/components/clan-header";
import { ClanTabs } from "./-clan-tabs";
import { ClanPageSkeleton } from "./-skeleton";

export const Route = createFileRoute("/(private)/clan/$clanTag")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      error: (search.error as string) || undefined,
    };
  },
  loader: async ({ context: { queryClient }, params }) => {
    try {
      await queryClient.ensureQueryData(getClanInfoQueryOptions(params.clanTag));
    } catch (error: unknown) {
      handleClanErrorWithRedirect(error, params.clanTag);
    }
  },
  pendingComponent: () => <ClanPageSkeleton />,
  component: ClanLayout,
});

function ClanLayout() {
  const { clanTag } = Route.useParams();
  const { data: clanStats } = useSuspenseQuery(getClanInfoQueryOptions(clanTag));

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        <ClanHeader
          clanName={clanStats.name}
          clanTag={clanTag}
          description={clanStats.description}
          compact={true}
        />

        <ClanTabs clanTag={clanTag} />

        <Outlet />
      </div>
    </div>
  );
}
