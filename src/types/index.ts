export type Role = "ADMIN" | "USER" | "OWNER";

export interface User {
  id: string;
  name: string;
  email: string;
  address: string;
  role: Role;
}

export interface Store {
  id: string;
  name: string;
  email: string;
  address: string;
  averageRating: number;
  ownerId: string | null;
  ratingCount?: number;
}

export interface Rating {
  id: string;
  userId: string;
  storeId: string;
  value: number;
  createdAt: string;
}

export interface StoreWithMyRating extends Store {
  myRating: number | null;
}

export interface DashboardStats {
  totalUsers: number;
  totalStores: number;
  totalRatings: number;
}

export interface OwnerDashboard {
  store: Store | null;
  averageRating: number;
  raters: Array<{
    userId: string;
    name: string;
    email: string;
    value: number;
    createdAt: string;
  }>;
}

export interface AuthSession {
  token: string;
  user: User;
}
