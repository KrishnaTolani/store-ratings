export const NAME_MIN = 20;
export const NAME_MAX = 60;
export const ADDRESS_MAX = 400;

export function validateName(value: string): string | null {
  const v = value.trim();
  if (!v) return "Name is required.";
  if (v.length < NAME_MIN) return `Name must be at least ${NAME_MIN} characters (currently ${v.length}).`;
  if (v.length > NAME_MAX) return `Name must be at most ${NAME_MAX} characters.`;
  return null;
}

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address.";
  return null;
}

export function validateAddress(value: string): string | null {
  const v = value.trim();
  if (!v) return "Address is required.";
  if (v.length > ADDRESS_MAX) return `Address must be at most ${ADDRESS_MAX} characters.`;
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Password is required.";
  if (value.length < 8 || value.length > 16) return "Password must be 8–16 characters.";
  if (!/[A-Z]/.test(value)) return "Password must include at least one uppercase letter.";
  if (!/[!@#$%^&*(),.?":{}|<>_\-[\]\\/~`+=;']/.test(value))
    return "Password must include at least one special character.";
  return null;
}

export function validateConfirm(password: string, confirm: string): string | null {
  if (!confirm) return "Please confirm your password.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

export type Errors<T extends string> = Partial<Record<T, string | undefined>>;

export function clean<T extends string>(errors: Errors<T>): Errors<T> {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => Boolean(v))) as Errors<T>;
}
