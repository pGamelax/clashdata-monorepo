import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(private)/players")({
  component: PlayersLayout,
});

function PlayersLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 lg:py-10">
        <Outlet />
      </div>
    </div>
  );
}
