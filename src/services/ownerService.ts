import type { OwnerDashboard } from "@/types";
import { delay } from "./config";
import { averageFor, getDb } from "./mockDb";

export const ownerService = {
  async getDashboard(ownerId: string): Promise<OwnerDashboard> {
    await delay();
    const db = getDb();
    const store = db.stores.find((s) => s.ownerId === ownerId) ?? null;
    if (!store) return { store: null, averageRating: 0, raters: [] };
    const raters = db.ratings
      .filter((r) => r.storeId === store.id)
      .map((r) => {
        const u = db.users.find((x) => x.id === r.userId);
        return {
          userId: r.userId,
          name: u?.name ?? "Unknown user",
          email: u?.email ?? "—",
          value: r.value,
          createdAt: r.createdAt,
        };
      });
    return { store: { ...store, averageRating: averageFor(store.id) }, averageRating: averageFor(store.id), raters };
  },
};
