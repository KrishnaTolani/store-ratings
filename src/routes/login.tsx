import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Store as StoreIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/FormField";
import { roleHome } from "@/services/mockDb";
import { validateEmail, type Errors } from "@/utils/validation";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Store Ratings" },
      { name: "description", content: "Sign in to your Store Ratings account to rate and manage stores." },
      { property: "og:title", content: "Sign in — Store Ratings" },
      { property: "og:description", content: "Access your Store Ratings dashboard." },
    ],
  }),
  component: LoginPage,
});

const demos = [
  { label: "Administrator", email: "admin@storeratings.app", password: "Admin@1234" },
  { label: "Normal user", email: "jonathan@example.com", password: "User@1234" },
  { label: "Store owner", email: "gregory@northsidegoods.com", password: "Owner@1234" },
];

function LoginPage() {
  const { login, user, ready } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors<"email" | "password">>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: roleHome[user.role], replace: true });
  }, [ready, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors<"email" | "password"> = {};
    const emailError = validateEmail(email);
    if (emailError) next.email = emailError;
    if (!password) next.password = "Password is required.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const session = await login(email, password);
      toast.success(`Welcome back, ${session.user.name.split(" ")[0]}!`);
      navigate({ to: roleHome[session.user.role], replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden brand-gradient p-12 lg:flex">
        <div className="flex items-center gap-3 text-primary-foreground">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <StoreIcon className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold">Store Ratings</span>
        </div>
        <div className="max-w-md text-primary-foreground">
          <h2 className="text-4xl font-extrabold leading-tight">
            Every rating tells a story about your storefront.
          </h2>
          <p className="mt-4 text-sm/6 opacity-85">
            One platform for administrators, customers and store owners — clean tables, instant filters and
            honest 1–5 star feedback.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/70">Demo environment · mock data only</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use your email and password to continue.</p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <FormField label="Email" htmlFor="email" error={errors.email}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </FormField>
            <FormField label="Password" htmlFor="password" error={errors.password}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </FormField>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Create a user account
            </Link>
          </p>

          <div className="surface-card mt-8 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Demo accounts
            </p>
            <div className="mt-3 space-y-2">
              {demos.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword(d.password);
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                >
                  <span className="font-medium">{d.label}</span>
                  <span className="text-xs text-muted-foreground">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
