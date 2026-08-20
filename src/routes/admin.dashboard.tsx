import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Star, Users } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { adminService } from "@/services/adminService";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — Store Ratings" },
      { name: "description", content: "Platform totals for users, stores and submitted ratings." },
      { property: "og:title", content: "Admin dashboard — Store Ratings" },
      { property: "og:description", content: "Monitor users, stores and ratings at a glance." },
    ],
  }),
  component: () => (
    <ProtectedRoute role="ADMIN">
      <AdminDashboard />
    </ProtectedRoute>
  ),
});

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminService.getDashboardStats,
  });

  const cards = [
    { label: "Total users", value: data?.totalUsers, icon: Users, tint: "bg-chart-1/12 text-chart-1" },
    { label: "Total stores", value: data?.totalStores, icon: Building2, tint: "bg-chart-2/15 text-chart-2" },
    { label: "Total ratings", value: data?.totalRatings, icon: Star, tint: "bg-star/15 text-star" },
  ];

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Everything happening across Store Ratings right now."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/add-user">Add user</Link>
            </Button>
            <Button asChild>
              <Link to="/admin/add-store">Add store</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="surface-card p-6">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
              <span className={`rounded-xl p-2 ${c.tint}`}>
                <c.icon className="h-5 w-5" />
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="mt-4 h-10 w-20" />
            ) : (
              <p className="mt-3 text-4xl font-extrabold tracking-tight">{c.value ?? 0}</p>
            )}
          </div>
        ))}
      </div>

      <div className="surface-card mt-6 p-6">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the directory of people and storefronts on the platform.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link to="/admin/users">Manage users</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/admin/stores">Manage stores</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
