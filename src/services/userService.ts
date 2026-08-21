import type { Rating, Store, StoreDetail } from "@/types";
import { request } from "./config";

export const userService = {
  getStores: (_userId?: string) => request<Store[]>("/user/stores"),

  getStoreById: (storeId: string) => request<StoreDetail>(`/user/stores/${storeId}`),

  submitRating: (
    _userId: string,
    storeId: string,
    value: number,
    extra?: { comment?: string; emoji?: string },
  ) =>
    request<Rating>(`/user/stores/${storeId}/ratings`, {
      method: "POST",
      body: JSON.stringify({ value, comment: extra?.comment ?? "", emoji: extra?.emoji ?? "" }),
    }),

  updateRating: (
    _userId: string,
    storeId: string,
    value: number,
    extra?: { comment?: string; emoji?: string },
  ) =>
    request<Rating>(`/user/stores/${storeId}/ratings`, {
      method: "PUT",
      body: JSON.stringify({ value, comment: extra?.comment ?? "", emoji: extra?.emoji ?? "" }),
    }),
};
