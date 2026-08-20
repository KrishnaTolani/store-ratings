import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { roleHome } from "@/services/mockDb";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Store Ratings — Role-based store rating platform" },
      {
        name: "description",
        content:
          "Sign in to Store Ratings to rate stores from 1 to 5, manage users and stores as an admin, or track your store performance as an owner.",
      },
      { property: "og:title", content: "Store Ratings" },
      {
        property: "og:description",
        content: "Rate stores, manage users and track store performance in one clean dashboard.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    navigate({ to: user ? roleHome[user.role] : "/login", replace: true });
  }, [ready, user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
