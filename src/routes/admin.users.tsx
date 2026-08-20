import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminService } from "@/services/adminService";
import type { Role, User } from "@/types";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Manage users — Store Ratings" },
      { name: "description", content: "Search, filter and sort every account on the platform." },
      { property: "og:title", content: "Manage users — Store Ratings" },
      { property: "og:description", content: "Admin directory of administrators, users and store owners." },
    ],
  }),
  component: () => (
    <ProtectedRoute role="ADMIN">
      <AdminUsers />
    </ProtectedRoute>
  ),
});

const roleTone: Record<Role, string> = {
  ADMIN: "bg-chart-1/12 text-chart-1",
  USER: "bg-chart-2/15 text-chart-2",
  OWNER: "bg-star/20 text-accent-foreground",
};

function AdminUsers() {
  const { data = [], isLoading } = useQuery({ queryKey: ["admin", "users"], queryFn: adminService.getUsers });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<"ALL" | Role>("ALL");

  const rows = useMemo(
    () =>
      data.filter(
        (u) =>
          u.name.toLowerCase().includes(name.toLowerCase().trim()) &&
          u.email.toLowerCase().includes(email.toLowerCase().trim()) &&
          u.address.toLowerCase().includes(address.toLowerCase().trim()) &&
          (role === "ALL" || u.role === role),
      ),
    [data, name, email, address, role],
  );

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
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
      key: "role",
      header: "Role",
      sortable: true,
      sortValue: (r) => r.role,
      render: (r) => (
        <Badge variant="secondary" className={roleTone[r.role]}>
          {r.role}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/users/$id" params={{ id: r.id }}>
            View details
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        description={`${rows.length} of ${data.length} accounts shown.`}
        actions={
          <Button asChild>
            <Link to="/admin/add-user">Add user</Link>
          </Button>
        }
      />

      <div className="surface-card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Filter by name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Input placeholder="Filter by email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Filter by address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Select value={role} onValueChange={(v) => setRole(v as "ALL" | Role)}>
          <SelectTrigger>
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="OWNER">Owner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={isLoading}
        initialSort={{ key: "name", dir: "asc" }}
        emptyTitle="No users match your filters"
      />
    </>
  );
}
