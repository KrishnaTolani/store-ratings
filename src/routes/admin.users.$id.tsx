import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { RatingStars } from "@/components/RatingStars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { adminService } from "@/services/adminService";
import type { Role } from "@/types";

const roleLabel: Record<Role, string> = {
  ADMIN: "Administrator",
  USER: "Normal user",
  OWNER: "Store owner",
};

const roleTone: Record<Role, string> = {
  ADMIN: "bg-chart-1/12 text-chart-1",
  USER: "bg-chart-2/15 text-chart-2",
  OWNER: "bg-star/20 text-accent-foreground",
};

export const Route = createFileRoute("/admin/users/$id")({
  head: () => ({
    meta: [
      { title: "User detail — Store Ratings" },
      { name: "description", content: "View account details for a platform user." },
    ],
  }),
  component: () => (
    <ProtectedRoute role="ADMIN">
      <UserDetailPage />
    </ProtectedRoute>
  ),
});

function UserDetailPage() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => adminService.getUserById(id),
    enabled: Boolean(id),
  });

  const user = data?.user;

  return (
    <>
      <PageHeader
        title={isLoading ? "Loading…" : (user?.name ?? "User detail")}
        description="Account information"
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/users">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to users
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="surface-card max-w-lg space-y-5 p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-3/4" />
          ))}
        </div>
      ) : !user ? (
        <p className="text-sm text-muted-foreground">User not found.</p>
      ) : (
        <div className="max-w-lg space-y-6">
          {/* Main info card */}
          <div className="surface-card space-y-5 p-6">
            <Field label="Name" value={user.name} />
            <Separator />
            <Field label="Email" value={user.email} />
            <Separator />
            <Field label="Address" value={user.address} />
            <Separator />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Role
              </p>
              <Badge
                variant="secondary"
                className={`mt-1.5 ${roleTone[user.role]}`}
              >
                {roleLabel[user.role]}
              </Badge>
            </div>
          </div>

          {/* Store rating card — only for OWNER */}
          {user.role === "OWNER" && (
            <div className="surface-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Store rating</h2>
              </div>

              {data.storeRating == null ? (
                <p className="text-sm text-muted-foreground">
                  No store is linked to this owner account yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.storeName && (
                    <p className="text-sm font-medium">{data.storeName}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <RatingStars value={data.storeRating} size="md" />
                    <span className="text-2xl font-extrabold tracking-tight">
                      {data.storeRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">avg rating</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm">{value || <span className="italic text-muted-foreground">—</span>}</p>
    </div>
  );
}
