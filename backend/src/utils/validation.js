const NAME_MIN = 20;
const NAME_MAX = 60;
const ADDRESS_MAX = 400;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SPECIAL_RE = /[!@#$%^&*(),.?":{}|<>_\-[\]\\/~`+=;']/;

export function validateName(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Name is required.";
  if (v.length < NAME_MIN) return `Name must be at least ${NAME_MIN} characters.`;
  if (v.length > NAME_MAX) return `Name must be at most ${NAME_MAX} characters.`;
  return null;
}

export function validateEmail(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Email is required.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
  return null;
}

export function validateAddress(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Address is required.";
  if (v.length > ADDRESS_MAX) return `Address must be at most ${ADDRESS_MAX} characters.`;
  return null;
}

export function validatePassword(value) {
  const v = String(value ?? "");
  if (!v) return "Password is required.";
  if (v.length < 8 || v.length > 16) return "Password must be 8–16 characters.";
  if (!/[A-Z]/.test(v)) return "Password must include at least one uppercase letter.";
  if (!SPECIAL_RE.test(v)) return "Password must include at least one special character.";
  return null;
}

export function validateRole(value) {
  if (!["ADMIN", "USER", "OWNER"].includes(value)) return "Role must be ADMIN, USER, or OWNER.";
  return null;
}

export function validateRating(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) return "Rating must be a whole number between 1 and 5.";
  return null;
}

/** Collect first error from a map of field -> validate result */
export function firstError(checks) {
  for (const msg of Object.values(checks)) {
    if (msg) return msg;
  }
  return null;
}
