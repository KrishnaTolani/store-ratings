import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query } from "../config/db.js";
import { HttpError, publicUser } from "../utils/helpers.js";

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) throw new HttpError("Authentication required.", 401);

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw new HttpError("Invalid or expired token.", 401);
    }

    const rows = await query(
      "SELECT id, name, email, address, role FROM users WHERE id = :id LIMIT 1",
      { id: payload.sub },
    );
    if (!rows.length) throw new HttpError("Account not found.", 401);

    req.user = publicUser(rows[0]);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError("You do not have permission to perform this action.", 403));
    }
    next();
  };
}
