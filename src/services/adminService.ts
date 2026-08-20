import type { DashboardStats, Role, Store, User } from "@/types";
import { ApiError, delay } from "./config";
import { averageFor, getDb, hydrateStores, persist, publicUser, uid } from "./mockDb";

export const adminService = {
  async getDashboardStats(): Promise<DashboardStats> {
    await delay();
    const db = getDb();
    return {
      totalUsers: db.users.length,
      totalStores: db.stores.length,
      totalRatings: db.ratings.length,
    };
  },

  async getUsers(): Promise<User[]> {
    await delay();
    return getDb().users.map(publicUser);
  },

  async getUserById(id: string): Promise<{ user: User; storeRating: number | null; storeName?: string }> {
    await delay();
    const db = getDb();
    const found = db.users.find((u) => u.id === id);
    if (!found) throw new ApiError("User not found.", 404);
    const store = db.stores.find((s) => s.ownerId === found.id);
    return {
      user: publicUser(found),
      storeRating: store ? averageFor(store.id) : null,
      storeName: store?.name,
    };
  },

  async createUser(input: {
    name: string;
    email: string;
    address: string;
    password: string;
    role: Role;
  }): Promise<User> {
    await delay();
    const db = getDb();
    if (db.users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) {
      throw new ApiError("An account with this email already exists.", 409);
    }
    const user = {
      id: uid(input.role === "OWNER" ? "o" : "u"),
      name: input.name.trim(),
      email: input.email.trim(),
      address: input.address.trim(),
      role: input.role,
      password: input.password,
    };
    db.users.push(user);
    persist();
    return publicUser(user);
  },

  async getStores(): Promise<Store[]> {
    await delay();
    return hydrateStores();
  },

  async getOwners(): Promise<User[]> {
    await delay(120);
    return getDb().users.filter((u) => u.role === "OWNER").map(publicUser);
  },

  async createStore(input: {
    name: string;
    email: string;
    address: string;
    ownerId: string | null;
  }): Promise<Store> {
    await delay();
    const db = getDb();
    if (db.stores.some((s) => s.email.toLowerCase() === input.email.trim().toLowerCase())) {
      throw new ApiError("A store with this email already exists.", 409);
    }
    const store: Store = {
      id: uid("s"),
      name: input.name.trim(),
      email: input.email.trim(),
      address: input.address.trim(),
      ownerId: input.ownerId,
      averageRating: 0,
      ratingCount: 0,
    };
    db.stores.push(store);
    persist();
    return store;
  },
};
