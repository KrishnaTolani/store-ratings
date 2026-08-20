import type { Rating, Role, Store, User } from "@/types";

const DB_KEY = "store-ratings.db.v1";

export interface DbShape {
  users: Array<User & { password: string }>;
  stores: Store[];
  ratings: Rating[];
}

const seed = (): DbShape => ({
  users: [
    {
      id: "u-admin",
      name: "Alexandra Systems Administrator",
      email: "admin@storeratings.app",
      address: "18 Quantum Avenue, Cupertino, CA",
      role: "ADMIN",
      password: "Admin@1234",
    },
    {
      id: "u-1",
      name: "Jonathan Michael Richardson",
      email: "jonathan@example.com",
      address: "44 Maple Street, Brooklyn, NY",
      role: "USER",
      password: "User@1234",
    },
    {
      id: "u-2",
      name: "Priyanka Venkatanarayanan",
      email: "priyanka@example.com",
      address: "9 Rosewood Lane, Austin, TX",
      role: "USER",
      password: "User@1234",
    },
    {
      id: "o-1",
      name: "Gregory Alan Whitmore Owner",
      email: "gregory@northsidegoods.com",
      address: "120 Harbour Road, Seattle, WA",
      role: "OWNER",
      password: "Owner@1234",
    },
    {
      id: "o-2",
      name: "Isabella Marie Fontaine Owner",
      email: "isabella@fontainemarket.com",
      address: "77 Vine Street, Portland, OR",
      role: "OWNER",
      password: "Owner@1234",
    },
  ],
  stores: [
    {
      id: "s-1",
      name: "Northside Goods & Provisions Co.",
      email: "hello@northsidegoods.com",
      address: "120 Harbour Road, Seattle, WA",
      averageRating: 0,
      ownerId: "o-1",
    },
    {
      id: "s-2",
      name: "Fontaine Market and Fine Foods",
      email: "contact@fontainemarket.com",
      address: "77 Vine Street, Portland, OR",
      averageRating: 0,
      ownerId: "o-2",
    },
    {
      id: "s-3",
      name: "Evergreen Hardware Supply Depot",
      email: "support@evergreenhardware.com",
      address: "301 Cedar Boulevard, Denver, CO",
      averageRating: 0,
      ownerId: null,
    },
  ],
  ratings: [
    { id: "r-1", userId: "u-1", storeId: "s-1", value: 5, createdAt: "2026-06-02T10:12:00.000Z" },
    { id: "r-2", userId: "u-2", storeId: "s-1", value: 4, createdAt: "2026-06-11T15:40:00.000Z" },
    { id: "r-3", userId: "u-1", storeId: "s-2", value: 3, createdAt: "2026-07-01T09:05:00.000Z" },
    { id: "r-4", userId: "u-2", storeId: "s-2", value: 5, createdAt: "2026-07-19T18:22:00.000Z" },
    { id: "r-5", userId: "u-2", storeId: "s-3", value: 2, createdAt: "2026-08-03T12:00:00.000Z" },
  ],
});

let memory: DbShape | null = null;

export function getDb(): DbShape {
  if (memory) return memory;
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(DB_KEY);
    if (raw) {
      try {
        memory = JSON.parse(raw) as DbShape;
        return memory;
      } catch {
        /* fall through to seed */
      }
    }
  }
  memory = seed();
  persist();
  return memory;
}

export function persist() {
  if (typeof window !== "undefined" && memory) {
    window.localStorage.setItem(DB_KEY, JSON.stringify(memory));
  }
}

export function averageFor(storeId: string): number {
  const db = getDb();
  const vals = db.ratings.filter((r) => r.storeId === storeId).map((r) => r.value);
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export function hydrateStores(): Store[] {
  const db = getDb();
  return db.stores.map((s) => ({
    ...s,
    averageRating: averageFor(s.id),
    ratingCount: db.ratings.filter((r) => r.storeId === s.id).length,
  }));
}

export function publicUser(u: User & { password?: string }): User {
  const { id, name, email, address, role } = u;
  return { id, name, email, address, role };
}

export const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

export const roleHome: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  USER: "/user/stores",
  OWNER: "/owner/dashboard",
};
