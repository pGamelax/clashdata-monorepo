import { createFileRoute, Outlet } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/footer";

const authQueryOptions = queryOptions({
  queryKey: ["session"],
  queryFn: () => apiFetch(`${import.meta.env.VITE_API_URL}/auth/get-session`),
});

const clansQueryOptions = queryOptions({
  queryKey: ["my-clans"],
  queryFn: () => apiFetch(`${import.meta.env.VITE_API_URL}/clans/get-clans`),
});

export const Route = createFileRoute("/(home)")({
  loader: async ({ context: { queryClient } }) => {
    try {
      await Promise.all([
        queryClient.ensureQueryData(authQueryOptions),
        queryClient.ensureQueryData(clansQueryOptions),
      ]);
    } catch (error: any) {}
  },
 
  component: RouteComponent,
});

function RouteComponent() {
  const { data: user } = useQuery(authQueryOptions);
  const { data: clans } = useQuery(clansQueryOptions);

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
