import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clean, validateConfirm, validatePassword, type Errors } from "@/utils/validation";

type Field = "current" | "password" | "confirm";

export function UpdatePasswordForm() {
  const { user } = useAuth();
  const [form, setForm] = useState({ current: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors<Field>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: Field, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const next = clean<Field>({
      current: form.current ? undefined : "Enter your current password.",
      password: validatePassword(form.password) ?? undefined,
      confirm: validateConfirm(form.password, form.confirm) ?? undefined,
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await authService.updatePassword(user.id, form.current, form.password);
      setForm({ current: "", password: "", confirm: "" });
      toast.success("Password updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update your password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="surface-card max-w-lg space-y-4 p-6" noValidate>
      <FormField label="Current password" htmlFor="current" error={errors.current}>
        <Input
          id="current"
          type="password"
          value={form.current}
          onChange={(e) => set("current", e.target.value)}
        />
      </FormField>
      <FormField
        label="New password"
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
      <FormField label="Confirm new password" htmlFor="confirm" error={errors.confirm}>
        <Input
          id="confirm"
          type="password"
          value={form.confirm}
          onChange={(e) => set("confirm", e.target.value)}
        />
      </FormField>
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {saving ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
