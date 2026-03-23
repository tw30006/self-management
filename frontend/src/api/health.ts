import http from "./http";
import type { HealthResponse } from "../types/api";

export const checkHealth = async () => {
  const { data } = await http.get<HealthResponse>("/health");
  return data;
};
