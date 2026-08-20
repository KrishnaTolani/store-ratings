import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingStars } from "@/components/RatingStars";
import { adminService } from "@/services/adminService";

export const Route = createFileRoute("/admin/users/$id")({
  head: () => ({
    meta: [
      { title: "User details — Store Ratings" },
      { name: "description", content: "Full profile for a Store Ratings account, including store rating." },
      { property: "og:title", content: "User details — Store Ratings" },
      { property: "og:description", content: "Review an account's profile and store performance." },
    ],
  }),
  component: () => (
    <ProtectedRoute role="ADMIN">
      <UserDetail />
    </ProtectedRoute>
  ),
});

function UserDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => adminService.getUserById(id),
  });

  return (
    <>
      <PageHeader
        title="User details"
        description="Profile information for this account."
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/users">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to users
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="surface-card space-y-4 p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-2/3" />
          ))}
        </div>
      ) : isError || !data ? (
        <div className="surface-card p-10 text-center">
          <p className="font-medium">We couldn't find that user</p>
          <p className="mt-1 text-sm text-muted-foreground">The account may have been removed.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="surface-card p-6 lg:col-span-2">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Item label="Name" value={data.user.name} />
              <Item label="Email" value={data.user.email} />
              <Item label="Address" value={data.user.address} />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</dt>
                <dd className="mt-1">
                  <Badge variant="secondary">{data.user.role}</Badge>
                </dd>
              </div>
            </dl>
          </div>

          {data.user.role === "OWNER" && (
            <div className="surface-card p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Store rating
              </p>
              <p className="mt-2 truncate text-sm font-medium">{data.storeName ?? "No store assigned"}</p>
              <p className="mt-3 text-4xl font-extrabold">{(data.storeRating ?? 0).toFixed(1)}</p>
              <RatingStars value={data.storeRating ?? 0} className="mt-2" />
            </div>
          )}
        </div>
      )}
    </>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium break-words">{value}</dd>
    </div>
  );
}
