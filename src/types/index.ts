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
  coverUrl?: string | null;
  myRating?: number | null;
}

export interface Rating {
  id: string;
  userId: string;
  storeId: string;
  value: number;
  comment?: string;
  emoji?: string;
  createdAt: string;
}

export interface StoreReview {
  id: string;
  userId: string;
  name: string;
  value: number;
  comment: string;
  emoji: string;
  createdAt: string;
}

export interface StoreDetail {
  store: Store;
  photos: string[];
  reviews: StoreReview[];
  myReview: { value: number; comment: string; emoji: string } | null;
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
    comment: string;
    emoji: string;
    createdAt: string;
  }>;
}

export interface AuthSession {
  token: string;
  user: User;
}
