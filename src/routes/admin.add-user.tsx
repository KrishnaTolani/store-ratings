import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminService } from "@/services/adminService";
import {
  clean,
  validateAddress,
  validateEmail,
  validateName,
  validatePassword,
  type Errors,
} from "@/utils/validation";

export const Route = createFileRoute("/admin/add-user")({
  head: () => ({
    meta: [
      { title: "Add user — Store Ratings" },
      { name: "description", content: "Create a normal user account." },
    ],
  }),
  component: () => (
    <ProtectedRoute role="ADMIN">
      <AddUser />
    </ProtectedRoute>
  ),
});

type Field = "name" | "email" | "address" | "password" | "confirm";

function AddUser() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", address: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: Field, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = clean<Field>({
      name: validateName(form.name) ?? undefined,
      email: validateEmail(form.email) ?? undefined,
      address: validateAddress(form.address) ?? undefined,
      password: validatePassword(form.password) ?? undefined,
      confirm:
        form.confirm === ""
          ? "Please confirm the password."
          : form.password !== form.confirm
            ? "Passwords do not match."
            : undefined,
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await adminService.createUser({
        name: form.name,
        email: form.email,
        address: form.address,
        password: form.password,
      });
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("User account created.");
      navigate({ to: "/admin/users" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to create this user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add normal user"
        description="Create a standard user account. Role is set to Normal User automatically."
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/users">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to users
            </Link>
          </Button>
        }
      />

      <form onSubmit={submit} className="surface-card max-w-2xl space-y-4 p-6" noValidate>
        <FormField
          label="Full name"
          htmlFor="name"
          error={errors.name}
          hint={`Min 20, max 60 characters (${form.name.trim().length}/60).`}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Password"
            htmlFor="password"
            error={errors.password}
            hint="8–16 chars, 1 uppercase, 1 special character."
          >
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </FormField>

          <FormField label="Confirm password" htmlFor="confirm" error={errors.confirm}>
            <Input
              id="confirm"
              type="password"
              value={form.confirm}
              onChange={(e) => set("confirm", e.target.value)}
            />
          </FormField>
        </div>

        <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
          The new account will have the <strong>Normal User</strong> role and will be able to
          browse stores and submit ratings after their first login.
        </div>

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Creating…" : "Create user"}
        </Button>
      </form>
    </>
  );
}
