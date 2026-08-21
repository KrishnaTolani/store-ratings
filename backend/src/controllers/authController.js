import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import { signToken } from "../middleware/auth.js";
import { HttpError, publicUser } from "../utils/helpers.js";
import {
  firstError,
  validateAddress,
  validateEmail,
  validateName,
  validatePassword,
} from "../utils/validation.js";

export async function login(req, res) {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");

  const errMsg = firstError({
    email: validateEmail(email),
    password: password ? null : "Password is required.",
  });
  if (errMsg) throw new HttpError(errMsg);

  const rows = await query(
    "SELECT id, name, email, address, role, password_hash FROM users WHERE email = :email LIMIT 1",
    { email },
  );
  if (!rows.length) throw new HttpError("Incorrect email or password.", 401);

  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) throw new HttpError("Incorrect email or password.", 401);

  const user = publicUser(rows[0]);
  res.json({ token: signToken(user), user });
}

export async function signup(req, res) {
  const name = String(req.body.name ?? "").trim();
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const address = String(req.body.address ?? "").trim();
  const password = String(req.body.password ?? "");

  const errMsg = firstError({
    name: validateName(name),
    email: validateEmail(email),
    address: validateAddress(address),
    password: validatePassword(password),
  });
  if (errMsg) throw new HttpError(errMsg);

  const existing = await query("SELECT id FROM users WHERE email = :email LIMIT 1", { email });
  if (existing.length) throw new HttpError("An account with this email already exists.", 409);

  const password_hash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (name, email, password_hash, address, role)
     VALUES (:name, :email, :password_hash, :address, 'USER')`,
    { name, email, password_hash, address },
  );

  const user = {
    id: String(result.insertId),
    name,
    email,
    address,
    role: "USER",
  };
  res.status(201).json({ token: signToken(user), user });
}

export async function updatePassword(req, res) {
  if (req.user.role === "ADMIN") {
    throw new HttpError("Administrators cannot update their password through this endpoint.", 403);
  }

  const currentPassword = String(req.body.currentPassword ?? "");
  const newPassword = String(req.body.newPassword ?? "");

  const errMsg = firstError({
    current: currentPassword ? null : "Enter your current password.",
    password: validatePassword(newPassword),
  });
  if (errMsg) throw new HttpError(errMsg);

  const rows = await query(
    "SELECT id, password_hash FROM users WHERE id = :id LIMIT 1",
    { id: req.user.id },
  );
  if (!rows.length) throw new HttpError("Account not found.", 404);

  const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!ok) throw new HttpError("Your current password is incorrect.", 401);

  const password_hash = await bcrypt.hash(newPassword, 10);
  await query("UPDATE users SET password_hash = :password_hash WHERE id = :id", {
    password_hash,
    id: req.user.id,
  });

  res.json({ message: "Password updated." });
}

export async function me(req, res) {
  res.json({ user: req.user });
}
