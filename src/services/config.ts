export const API_BASE_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined) || "http://localhost:5000/api";

/** Flip to false once real REST endpoints are available. */
export const USE_MOCK_API = true;

/** Simulated network latency for the mock layer (ms). */
export const MOCK_LATENCY = 350;

export const delay = (ms: number = MOCK_LATENCY) => new Promise((r) => setTimeout(r, ms));

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Thin fetch wrapper — pages never call this directly, only services do.
 * Replace mock bodies in the services with `request<T>(...)` calls.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new ApiError(await res.text().catch(() => res.statusText), res.status);
  return (await res.json()) as T;
}
