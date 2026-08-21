import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { UpdatePasswordForm } from "@/components/UpdatePasswordForm";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types";

const roleLabel: Record<Role, string> = {
  ADMIN: "Administrator",
  USER: "Normal user",
  OWNER: "Store owner",
};

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My profile — Store Ratings" },
      { name: "description", content: "View your account details and update your password." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
});

function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-lg">
        <PageHeader title="My profile" description="Your account details and password." />

        <div className="surface-card mb-8 space-y-4 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</p>
            <p className="mt-1 font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
            <p className="mt-1">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</p>
            <p className="mt-1 text-muted-foreground">{user.address}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</p>
            <Badge variant="secondary" className="mt-1">
              {roleLabel[user.role]}
            </Badge>
          </div>
        </div>

        {user.role !== "ADMIN" && (
          <>
            <h2 className="mb-3 text-lg font-semibold">Update password</h2>
            <UpdatePasswordForm />
          </>
        )}
      </div>
    </div>
  );
}
