import type { AuthSession, User } from "@/types";
import { request, SESSION_KEY } from "./config";

export const authService = {
  getSession(): AuthSession | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  },

  async login(email: string, password: string): Promise<AuthSession> {
    const session = await request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async signup(input: {
    name: string;
    email: string;
    address: string;
    password: string;
  }): Promise<AuthSession> {
    const session = await request<AuthSession>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    });
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async updatePassword(_userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await request("/auth/update-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async logout(): Promise<void> {
    if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
  },
};

export type { User };
