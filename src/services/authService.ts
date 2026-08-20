import type { AuthSession, Role, User } from "@/types";
import { ApiError, delay } from "./config";
import { getDb, persist, publicUser, uid } from "./mockDb";

const SESSION_KEY = "store-ratings.session.v1";

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
    await delay();
    const db = getDb();
    const found = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found || found.password !== password) {
      throw new ApiError("Incorrect email or password.", 401);
    }
    const session: AuthSession = { token: `mock.${found.id}.${Date.now()}`, user: publicUser(found) };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async signup(input: {
    name: string;
    email: string;
    address: string;
    password: string;
  }): Promise<AuthSession> {
    await delay();
    const db = getDb();
    if (db.users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) {
      throw new ApiError("An account with this email already exists.", 409);
    }
    const user: User & { password: string } = {
      id: uid("u"),
      name: input.name.trim(),
      email: input.email.trim(),
      address: input.address.trim(),
      role: "USER" as Role,
      password: input.password,
    };
    db.users.push(user);
    persist();
    const session: AuthSession = { token: `mock.${user.id}.${Date.now()}`, user: publicUser(user) };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await delay();
    const db = getDb();
    const found = db.users.find((u) => u.id === userId);
    if (!found) throw new ApiError("Account not found.", 404);
    if (found.password !== currentPassword) throw new ApiError("Your current password is incorrect.", 401);
    found.password = newPassword;
    persist();
  },

  async logout(): Promise<void> {
    if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
  },
};
