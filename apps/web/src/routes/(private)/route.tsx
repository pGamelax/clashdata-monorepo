import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
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

export const Route = createFileRoute("/(private)")({
  loader: async ({ context: { queryClient } }) => {
    try {
      await Promise.all([
        queryClient.ensureQueryData(authQueryOptions),
        queryClient.ensureQueryData(clansQueryOptions),
      ]);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        // 401: Não autorizado - redireciona para login
        if (error.status === 401) {
          throw redirect({
            to: "/sign-in",
            search: {
              error: "Sua sessão expirou. Faça login novamente.",
            },
          });
      }
      }
      // Re-lança o erro se não for um ApiError 401
      throw error;
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data: user } = useQuery(authQueryOptions);
  const { data: clans } = useQuery(clansQueryOptions);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header user={{ ...user.user, role: user.user?.role }} userClans={clans} />
      <main className="grow">
        <Outlet />
      </main>
      <Footer/>
    </div>
  );
}
