import { apiPost } from "./http";

export interface CreateTrainingPayload {
  performed_at: string;
  action_name: string;
  sets: number;
  reps: number;
  weight: number;
  heart_rate?: number;
  notes?: string;
}

export interface TrainingRecord {
  id: number;
  userId: number;
  performedAt: string;
  actionName: string;
  sets: number;
  reps: number;
  weight: string;
  heartRate: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function createTraining(payload: CreateTrainingPayload) {
  return apiPost<TrainingRecord>("/trainings", payload);
}
