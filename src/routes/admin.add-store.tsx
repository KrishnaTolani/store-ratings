import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminService } from "@/services/adminService";
import { clean, validateAddress, validateEmail, validateName, type Errors } from "@/utils/validation";

export const Route = createFileRoute("/admin/add-store")({
  head: () => ({
    meta: [
      { title: "Add store — Store Ratings" },
      { name: "description", content: "Register a new storefront and assign it to a store owner." },
      { property: "og:title", content: "Add store — Store Ratings" },
      { property: "og:description", content: "Register a new storefront on the platform." },
    ],
  }),
  component: () => (
    <ProtectedRoute role="ADMIN">
      <AddStore />
    </ProtectedRoute>
  ),
});

type Field = "name" | "email" | "address" | "ownerId";

function AddStore() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: owners = [], isLoading } = useQuery({
    queryKey: ["admin", "owners"],
    queryFn: adminService.getOwners,
  });
  const [form, setForm] = useState({ name: "", email: "", address: "", ownerId: "" });
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: Field, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = clean<Field>({
      name: validateName(form.name) ?? undefined,
      email: validateEmail(form.email) ?? undefined,
      address: validateAddress(form.address) ?? undefined,
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await adminService.createStore({
        name: form.name,
        email: form.email,
        address: form.address,
        ownerId: form.ownerId || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Store created successfully.");
      navigate({ to: "/admin/stores" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to create this store.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add store"
        description="Register a storefront and link it to its owner."
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/stores">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to stores
            </Link>
          </Button>
        }
      />

      <form onSubmit={submit} className="surface-card max-w-2xl space-y-4 p-6" noValidate>
        <FormField
          label="Store name"
          htmlFor="name"
          error={errors.name}
          hint={`Between 20 and 60 characters (${form.name.trim().length}/60).`}
        >
          <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </FormField>
        <FormField
          label="Address"
          htmlFor="address"
          error={errors.address}
          hint={`Max 400 characters (${form.address.trim().length}/400).`}
        >
          <Textarea id="address" rows={3} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </FormField>
        <FormField label="Store owner" htmlFor="owner" error={errors.ownerId} hint="Optional — can be assigned later.">
          <Select value={form.ownerId} onValueChange={(v) => set("ownerId", v)} disabled={isLoading}>
            <SelectTrigger id="owner">
              <SelectValue placeholder={isLoading ? "Loading owners…" : "Select a store owner"} />
            </SelectTrigger>
            <SelectContent>
              {owners.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name} · {o.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Creating…" : "Create store"}
        </Button>
      </form>
    </>
  );
}
