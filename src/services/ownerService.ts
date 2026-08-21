import type { OwnerDashboard } from "@/types";
import { request } from "./config";

export const ownerService = {
  getDashboard: (_ownerId: string) => request<OwnerDashboard>("/owner/dashboard"),
};
