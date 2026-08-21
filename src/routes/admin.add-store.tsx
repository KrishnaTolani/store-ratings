import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { adminService } from "@/services/adminService";
import {
  clean,
  validateAddress,
  validateEmail,
  validateName,
  validatePassword,
  type Errors,
} from "@/utils/validation";

export const Route = createFileRoute("/admin/add-store")({
  head: () => ({
    meta: [
      { title: "Add store — Store Ratings" },
      { name: "description", content: "Register a new storefront and assign it to a store owner." },
    ],
  }),
  component: () => (
    <ProtectedRoute role="ADMIN">
      <AddStore />
    </ProtectedRoute>
  ),
});

type OwnerMode = "existing" | "new" | "none";

type Field =
  | "name" | "email" | "address"
  | "ownerId"
  | "ownerName" | "ownerEmail" | "ownerAddress" | "ownerPassword" | "ownerConfirm";

function AddStore() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: owners = [], isLoading: ownersLoading } = useQuery({
    queryKey: ["admin", "owners"],
    queryFn: adminService.getOwners,
  });

  const [ownerMode, setOwnerMode] = useState<OwnerMode>("none");
  const [form, setForm] = useState({
    // store
    name: "", email: "", address: "",
    // existing owner
    ownerId: "",
    // new owner
    ownerName: "", ownerEmail: "", ownerAddress: "", ownerPassword: "", ownerConfirm: "",
  });
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: Field, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next = clean<Field>({
      name: validateName(form.name) ?? undefined,
      email: validateEmail(form.email) ?? undefined,
      address: validateAddress(form.address) ?? undefined,
      // existing owner required when mode is "existing"
      ownerId: ownerMode === "existing" && !form.ownerId ? "Please select an owner." : undefined,
      // new owner fields required when mode is "new"
      ownerName: ownerMode === "new" ? (validateName(form.ownerName) ?? undefined) : undefined,
      ownerEmail: ownerMode === "new" ? (validateEmail(form.ownerEmail) ?? undefined) : undefined,
      ownerAddress: ownerMode === "new" ? (validateAddress(form.ownerAddress) ?? undefined) : undefined,
      ownerPassword: ownerMode === "new" ? (validatePassword(form.ownerPassword) ?? undefined) : undefined,
      ownerConfirm:
        ownerMode === "new"
          ? form.ownerConfirm === ""
            ? "Please confirm the password."
            : form.ownerPassword !== form.ownerConfirm
              ? "Passwords do not match."
              : undefined
          : undefined,
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await adminService.createStore({
        name: form.name,
        email: form.email,
        address: form.address,
        ownerId: ownerMode === "existing" ? form.ownerId : null,
        ...(ownerMode === "new" && {
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail,
          ownerAddress: form.ownerAddress,
          ownerPassword: form.ownerPassword,
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success(
        ownerMode === "new"
          ? "Store created and login credentials sent to the owner's email."
          : "Store created successfully.",
      );
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
        description="Register a storefront, then choose how to handle the owner."
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/stores">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to stores
            </Link>
          </Button>
        }
      />

      <form onSubmit={submit} className="surface-card max-w-2xl space-y-5 p-6" noValidate>

        {/* ── Store details ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Store details
          </h3>

          <FormField
            label="Store name"
            htmlFor="name"
            error={errors.name}
            hint={`Min 20, max 60 characters (${form.name.trim().length}/60).`}
          >
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </FormField>

          <FormField label="Store email" htmlFor="email" error={errors.email}>
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
        </div>

        <Separator />

        {/* ── Owner assignment ──────────────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Store owner
          </h3>

          {/* Mode selector */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "none", label: "No owner yet" },
                { value: "existing", label: "Assign existing owner" },
                { value: "new", label: "Create new owner" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOwnerMode(opt.value)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors
                  ${ownerMode === opt.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
              >
                {opt.value === "new" && <UserPlus className="mr-1.5 inline h-3.5 w-3.5" />}
                {opt.label}
              </button>
            ))}
          </div>

          {/* Existing owner select */}
          {ownerMode === "existing" && (
            <FormField label="Select owner" htmlFor="owner" error={errors.ownerId}>
              <Select
                value={form.ownerId}
                onValueChange={(v) => set("ownerId", v)}
                disabled={ownersLoading}
              >
                <SelectTrigger id="owner">
                  <SelectValue placeholder={ownersLoading ? "Loading owners…" : "Choose an owner account"} />
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
          )}

          {/* New owner fields */}
          {ownerMode === "new" && (
            <div className="space-y-4 rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span>
                  A <strong>Store Owner</strong> account will be created and login credentials
                  will be sent to the owner's email address.
                </span>
              </div>

              <FormField
                label="Owner full name"
                htmlFor="ownerName"
                error={errors.ownerName}
                hint={`Min 20, max 60 characters (${form.ownerName.trim().length}/60).`}
              >
                <Input
                  id="ownerName"
                  value={form.ownerName}
                  onChange={(e) => set("ownerName", e.target.value)}
                />
              </FormField>

              <FormField label="Owner email" htmlFor="ownerEmail" error={errors.ownerEmail}
                hint="Credentials will be sent to this address.">
                <Input
                  id="ownerEmail"
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => set("ownerEmail", e.target.value)}
                />
              </FormField>

              <FormField
                label="Owner address"
                htmlFor="ownerAddress"
                error={errors.ownerAddress}
                hint={`Max 400 characters (${form.ownerAddress.trim().length}/400).`}
              >
                <Textarea
                  id="ownerAddress"
                  rows={2}
                  value={form.ownerAddress}
                  onChange={(e) => set("ownerAddress", e.target.value)}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Password"
                  htmlFor="ownerPassword"
                  error={errors.ownerPassword}
                  hint="8–16 chars, 1 uppercase, 1 special character."
                >
                  <Input
                    id="ownerPassword"
                    type="password"
                    value={form.ownerPassword}
                    onChange={(e) => set("ownerPassword", e.target.value)}
                  />
                </FormField>

                <FormField label="Confirm password" htmlFor="ownerConfirm" error={errors.ownerConfirm}>
                  <Input
                    id="ownerConfirm"
                    type="password"
                    value={form.ownerConfirm}
                    onChange={(e) => set("ownerConfirm", e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          )}
        </div>

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving
            ? "Creating…"
            : ownerMode === "new"
              ? "Create store & send credentials"
              : "Create store"}
        </Button>
      </form>
    </>
  );
}
