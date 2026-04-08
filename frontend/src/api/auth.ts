import { apiGet, apiPost } from "./http";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
}

export const getMe = () => apiGet<AuthUser>("/auth/me");

export const logout = () => apiPost<null>("/auth/logout");
