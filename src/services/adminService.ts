import type { DashboardStats, Store, User } from "@/types";
import { request } from "./config";

export const adminService = {
  getDashboardStats: () => request<DashboardStats>("/admin/stats"),

  getUsers: () => request<User[]>("/admin/users"),

  getUserById: (id: string) =>
    request<{ user: User; storeRating: number | null; storeName?: string }>("/admin/users/" + id),

  createUser: (input: {
    name: string;
    email: string;
    address: string;
    password: string;
  }) =>
    request<User>("/admin/users", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getStores: () => request<Store[]>("/admin/stores"),

  getOwners: () => request<User[]>("/admin/owners"),

  createStore: (input: {
    name: string;
    email: string;
    address: string;
    ownerId: string | null;
    ownerName?: string;
    ownerEmail?: string;
    ownerAddress?: string;
    ownerPassword?: string;
  }) =>
    request<Store>("/admin/stores", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
