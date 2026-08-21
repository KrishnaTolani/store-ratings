export const API_BASE_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined) || "http://localhost:5000/api";

export const SESSION_KEY = "store-ratings.session.v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const token = (JSON.parse(raw) as { token?: string }).token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: string }).message)
        : typeof body === "string" && body
          ? body
          : res.statusText;
    throw new ApiError(message, res.status);
  }

  return body as T;
}
