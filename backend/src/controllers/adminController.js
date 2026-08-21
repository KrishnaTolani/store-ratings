import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import { HttpError, mapStore, publicUser } from "../utils/helpers.js";
import { sendOwnerCredentials } from "../utils/email.js";
import {
  firstError,
  validateAddress,
  validateEmail,
  validateName,
  validatePassword,
} from "../utils/validation.js";

const STORE_SELECT = `
  SELECT
    s.id,
    s.name,
    s.email,
    s.address,
    s.owner_id,
    COALESCE(ROUND(AVG(r.value), 1), 0) AS average_rating,
    COUNT(r.id) AS rating_count
  FROM stores s
  LEFT JOIN ratings r ON r.store_id = s.id
`;

// ── Stats ────────────────────────────────────────────────────────────────────

export async function getDashboardStats(_req, res) {
  const users = await query("SELECT COUNT(*) AS c FROM users");
  const stores = await query("SELECT COUNT(*) AS c FROM stores");
  const ratings = await query("SELECT COUNT(*) AS c FROM ratings");
  res.json({
    totalUsers: Number(users[0].c),
    totalStores: Number(stores[0].c),
    totalRatings: Number(ratings[0].c),
  });
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(_req, res) {
  const rows = await query(
    "SELECT id, name, email, address, role FROM users ORDER BY name ASC",
  );
  res.json(rows.map(publicUser));
}

export async function getUserById(req, res) {
  const rows = await query(
    "SELECT id, name, email, address, role FROM users WHERE id = :id LIMIT 1",
    { id: req.params.id },
  );
  if (!rows.length) throw new HttpError("User not found.", 404);

  const user = publicUser(rows[0]);
  let storeRating = null;
  let storeName;

  if (user.role === "OWNER") {
    const stores = await query(
      `${STORE_SELECT} WHERE s.owner_id = :ownerId GROUP BY s.id LIMIT 1`,
      { ownerId: user.id },
    );
    if (stores.length) {
      storeRating = Number(stores[0].average_rating);
      storeName = stores[0].name;
    }
  }

  res.json({ user, storeRating, storeName });
}

/**
 * POST /admin/users
 * Creates a Normal User (role always USER).
 * Admin supplies: name, email, address, password.
 */
export async function createUser(req, res) {
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

  res.status(201).json({
    id: String(result.insertId),
    name,
    email,
    address,
    role: "USER",
  });
}

// ── Stores ───────────────────────────────────────────────────────────────────

export async function getStores(_req, res) {
  const rows = await query(`${STORE_SELECT} GROUP BY s.id ORDER BY s.name ASC`);
  res.json(rows.map(mapStore));
}

export async function getOwners(_req, res) {
  const rows = await query(
    "SELECT id, name, email, address, role FROM users WHERE role = 'OWNER' ORDER BY name ASC",
  );
  res.json(rows.map(publicUser));
}

/**
 * POST /admin/stores
 *
 * Two modes (mutually exclusive):
 *
 * Mode A — link to an existing owner:
 *   { name, email, address, ownerId }
 *
 * Mode B — create a brand-new owner at the same time:
 *   { name, email, address,
 *     ownerName, ownerEmail, ownerAddress, ownerPassword }
 *
 * In Mode B the owner account is created first, then the store is linked to it,
 * and login credentials are emailed to ownerEmail.
 */
export async function createStore(req, res) {
  const name = String(req.body.name ?? "").trim();
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const address = String(req.body.address ?? "").trim();

  const storeErr = firstError({
    name: validateName(name),
    email: validateEmail(email),
    address: validateAddress(address),
  });
  if (storeErr) throw new HttpError(storeErr);

  const existingStore = await query("SELECT id FROM stores WHERE email = :email LIMIT 1", { email });
  if (existingStore.length) throw new HttpError("A store with this email already exists.", 409);

  // ── Determine owner ID ───────────────────────────────────────────────────

  let ownerId = null;
  let newOwnerPassword = null; // kept for email delivery

  const rawOwnerId = req.body.ownerId;
  const creatingNewOwner =
    rawOwnerId === null || rawOwnerId === undefined || rawOwnerId === "" ||
    rawOwnerId === "new";

  if (creatingNewOwner && req.body.ownerEmail) {
    // Mode B — create new owner
    const ownerName = String(req.body.ownerName ?? "").trim();
    const ownerEmail = String(req.body.ownerEmail ?? "").trim().toLowerCase();
    const ownerAddress = String(req.body.ownerAddress ?? "").trim();
    const ownerPassword = String(req.body.ownerPassword ?? "");

    const ownerErr = firstError({
      ownerName: validateName(ownerName),
      ownerEmail: validateEmail(ownerEmail),
      ownerAddress: validateAddress(ownerAddress),
      ownerPassword: validatePassword(ownerPassword),
    });
    if (ownerErr) throw new HttpError(ownerErr);

    const existingOwner = await query(
      "SELECT id FROM users WHERE email = :email LIMIT 1",
      { email: ownerEmail },
    );
    if (existingOwner.length) {
      throw new HttpError("An account with the owner email already exists.", 409);
    }

    const password_hash = await bcrypt.hash(ownerPassword, 10);
    const ownerResult = await query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES (:name, :email, :password_hash, :address, 'OWNER')`,
      { name: ownerName, email: ownerEmail, password_hash, address: ownerAddress },
    );
    ownerId = ownerResult.insertId;
    newOwnerPassword = ownerPassword;

    // Store owner details for the email (sent after store row is inserted)
    req._newOwner = { name: ownerName, email: ownerEmail };
  } else if (!creatingNewOwner) {
    // Mode A — existing owner
    const id = Number(rawOwnerId);
    if (!Number.isInteger(id)) throw new HttpError("Invalid store owner.");
    const owners = await query(
      "SELECT id FROM users WHERE id = :id AND role = 'OWNER' LIMIT 1",
      { id },
    );
    if (!owners.length) throw new HttpError("Store owner not found.", 404);
    ownerId = id;
  }

  // ── Insert store ─────────────────────────────────────────────────────────

  const result = await query(
    `INSERT INTO stores (name, email, address, owner_id)
     VALUES (:name, :email, :address, :owner_id)`,
    { name, email, address, owner_id: ownerId },
  );

  // ── Send credentials email (non-blocking — don't fail the request) ────────

  if (req._newOwner && newOwnerPassword) {
    sendOwnerCredentials({
      name: req._newOwner.name,
      email: req._newOwner.email,
      password: newOwnerPassword,
      storeName: name,
    }).catch((err) => {
      console.error("[email] Failed to send owner credentials:", err.message);
    });
  }

  res.status(201).json({
    id: String(result.insertId),
    name,
    email,
    address,
    ownerId: ownerId != null ? String(ownerId) : null,
    averageRating: 0,
    ratingCount: 0,
  });
}
