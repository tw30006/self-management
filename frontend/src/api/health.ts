import { apiGet } from "./http";
import type { HealthResponse } from "../types/api";

export const checkHealth = async () => {
  return apiGet<HealthResponse>("/health");
};
