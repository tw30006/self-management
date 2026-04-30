import { apiGet, apiPost, apiEdit, apiDelete } from "./http";

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

export interface TrainingsPaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export interface TrainingsPage {
  trainings: TrainingRecord[];
  meta: TrainingsPaginationMeta;
}

export interface TrainingMarkersResponse {
  month: string;
  dates: string[];
}

export interface TrainingsByDateResponse {
  date: string;
  trainings: TrainingRecord[];
}

export function getTraining(id: number) {
  return apiGet<TrainingRecord>(`/trainings/${id}`);
}

export function createTraining(payload: CreateTrainingPayload) {
  return apiPost<TrainingRecord>("/trainings", payload);
}

export function getTrainings(page = 1, limit = 20) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiGet<TrainingsPage>(`/trainings?${query.toString()}`);
}

export function editTraining(
  id: number,
  payload: Partial<CreateTrainingPayload>,
) {
  return apiEdit<TrainingRecord>(`/trainings/${id}`, payload);
}

export function deleteTraining(id: number) {
  return apiDelete<void>(`/trainings/${id}`);
}

export function getTrainingMarkers(month: string) {
  const query = new URLSearchParams({ month });
  return apiGet<TrainingMarkersResponse>(
    `/trainings/markers?${query.toString()}`,
  );
}

export function getTrainingsByDate(date: string) {
  const query = new URLSearchParams({ date });
  return apiGet<TrainingsByDateResponse>(
    `/trainings/by-date?${query.toString()}`,
  );
}
