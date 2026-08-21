import type { Role } from "@/types";

export const roleHome: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  USER: "/user/stores",
  OWNER: "/owner/dashboard",
};
