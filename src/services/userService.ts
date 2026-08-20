import type { Rating, StoreWithMyRating } from "@/types";
import { ApiError, delay } from "./config";
import { getDb, hydrateStores, persist, uid } from "./mockDb";

export const userService = {
  async getStores(userId: string): Promise<StoreWithMyRating[]> {
    await delay();
    const db = getDb();
    return hydrateStores().map((s) => ({
      ...s,
      myRating: db.ratings.find((r) => r.storeId === s.id && r.userId === userId)?.value ?? null,
    }));
  },

  async submitRating(userId: string, storeId: string, value: number): Promise<Rating> {
    await delay(250);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new ApiError("Rating must be a whole number between 1 and 5.");
    }
    const db = getDb();
    const rating: Rating = {
      id: uid("r"),
      userId,
      storeId,
      value,
      createdAt: new Date().toISOString(),
    };
    db.ratings.push(rating);
    persist();
    return rating;
  },

  async updateRating(userId: string, storeId: string, value: number): Promise<Rating> {
    await delay(250);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new ApiError("Rating must be a whole number between 1 and 5.");
    }
    const db = getDb();
    const existing = db.ratings.find((r) => r.storeId === storeId && r.userId === userId);
    if (!existing) throw new ApiError("You have not rated this store yet.", 404);
    existing.value = value;
    existing.createdAt = new Date().toISOString();
    persist();
    return existing;
  },
};
