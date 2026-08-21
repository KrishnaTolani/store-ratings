import { HttpError } from "../utils/helpers.js";

export function notFound(_req, _res, next) {
  next(new HttpError("Route not found.", 404));
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const message = err.message || "Internal server error.";
  if (status >= 500) console.error(err);
  res.status(status).json({ message });
}
