import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { RatingStars } from "@/components/RatingStars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminService } from "@/services/adminService";
import type { Store } from "@/types";

export const Route = createFileRoute("/admin/stores")({
  head: () => ({
    meta: [
      { title: "Manage stores — Store Ratings" },
      { name: "description", content: "Browse every store with its average customer rating." },
      { property: "og:title", content: "Manage stores — Store Ratings" },
      { property: "og:description", content: "Admin directory of stores and their ratings." },
    ],
  }),
  component: () => (
    <ProtectedRoute role="ADMIN">
      <AdminStores />
    </ProtectedRoute>
  ),
});

function AdminStores() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "stores"],
    queryFn: adminService.getStores,
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const rows = useMemo(
    () =>
      data.filter(
        (s) =>
          s.name.toLowerCase().includes(name.toLowerCase().trim()) &&
          s.email.toLowerCase().includes(email.toLowerCase().trim()) &&
          s.address.toLowerCase().includes(address.toLowerCase().trim()),
      ),
    [data, name, email, address],
  );

  const columns: Column<Store>[] = [
    {
      key: "name",
      header: "Store name",
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => <span className="font-medium">{r.name}</span>,
    },
    { key: "email", header: "Email", sortable: true, sortValue: (r) => r.email, render: (r) => r.email },
    {
      key: "address",
      header: "Address",
      sortable: true,
      sortValue: (r) => r.address,
      render: (r) => <span className="text-muted-foreground">{r.address}</span>,
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      sortValue: (r) => r.averageRating,
      render: (r) => (
        <div className="flex items-center gap-2">
          <RatingStars value={r.averageRating} size="sm" />
          <span className="text-sm font-semibold">{r.averageRating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({r.ratingCount ?? 0})</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Stores"
        description={`${rows.length} of ${data.length} stores shown.`}
        actions={
          <Button asChild>
            <Link to="/admin/add-store">Add store</Link>
          </Button>
        }
      />

      <div className="surface-card mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Filter by name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Input placeholder="Filter by email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Filter by address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={isLoading}
        initialSort={{ key: "name", dir: "asc" }}
        emptyTitle="No stores match your filters"
      />
    </>
  );
}
