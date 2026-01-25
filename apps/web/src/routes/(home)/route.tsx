import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSessionQueryOptions, getClansQueryOptions } from "@/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/footer";

export const Route = createFileRoute("/(home)")({
  loader: async ({ context: { queryClient } }) => {
    try {
      await Promise.all([
        queryClient.ensureQueryData(getSessionQueryOptions),
        queryClient.ensureQueryData(getClansQueryOptions),
      ]);
    } catch (error: any) {}
  },
 
  component: RouteComponent,
});

function RouteComponent() {
  const { data: user } = useQuery(getSessionQueryOptions);
  const { data: clans } = useQuery(getClansQueryOptions);

  return (
    <div>
      <Header user={user?.user} userClans={clans} />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
