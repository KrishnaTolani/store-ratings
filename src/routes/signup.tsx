import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/FormField";
import { roleHome } from "@/services/mockDb";
import {
  clean,
  validateAddress,
  validateConfirm,
  validateEmail,
  validateName,
  validatePassword,
  type Errors,
} from "@/utils/validation";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — Store Ratings" },
      { name: "description", content: "Sign up as a normal user to rate stores from 1 to 5 stars." },
      { property: "og:title", content: "Create your account — Store Ratings" },
      { property: "og:description", content: "Join Store Ratings and start rating stores." },
    ],
  }),
  component: SignupPage,
});

type Field = "name" | "email" | "address" | "password" | "confirm";

function SignupPage() {
  const { signup, user, ready } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", address: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: roleHome[user.role], replace: true });
  }, [ready, user, navigate]);

  const set = (k: Field, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = clean<Field>({
      name: validateName(form.name) ?? undefined,
      email: validateEmail(form.email) ?? undefined,
      address: validateAddress(form.address) ?? undefined,
      password: validatePassword(form.password) ?? undefined,
      confirm: validateConfirm(form.password, form.confirm) ?? undefined,
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const session = await signup({
        name: form.name,
        email: form.email,
        address: form.address,
        password: form.password,
      });
      toast.success("Account created. Welcome aboard!");
      navigate({ to: roleHome[session.user.role], replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to create your account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Normal user sign-up. Administrators and store owners are created by an admin.
        </p>

        <form onSubmit={submit} className="surface-card mt-6 space-y-4 p-6" noValidate>
          <FormField
            label="Full name"
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
            <Textarea
              id="address"
              rows={3}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
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
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
