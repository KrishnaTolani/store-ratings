import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/layouts/AppLayout";
import { roleHome } from "@/services/mockDb";
import type { Role } from "@/types";

export function ProtectedRoute({
  role,
  children,
}: {
  role?: Role;
  children: ReactNode;
}) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/login", replace: true });
    else if (role && user.role !== role) navigate({ to: roleHome[user.role], replace: true });
  }, [ready, user, role, navigate]);

  if (!ready || !user || (role && user.role !== role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
