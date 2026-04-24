// src/models/training.ts
// Zod schema — 定義訓練紀錄 API 的請求體格式

import { z } from "zod";

export const createTrainingSchema = z.object({
  performed_at: z.iso.datetime(
    "請輸入符合 ISO 8601 格式的時間，例如 2024-01-01T10:00:00Z",
  ),
  action_name: z.string().min(1, "動作名稱不能為空"),
  sets: z.number().int().positive("組數必須為正整數"),
  reps: z.number().int().positive("次數必須為正整數"),
  // weight 可接受數字或字串（例如 "60.5"），後端會轉為 Prisma.Decimal 儲存
  weight: z.preprocess(
    (val) => {
      if (typeof val === "number" || typeof val === "string")
        return String(val);
      return val;
    },
    z
      .string()
      .regex(/^[0-9]+(\.[0-9]+)?$/, "重量必須為數字，可包含小數點，例如 60.5")
      .transform((s) => parseFloat(s))
      .refine((n) => n > 0, "重量必須為正數"),
  ),
  heart_rate: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

// 更新時所有欄位都是選填
export const updateTrainingSchema = createTrainingSchema.partial();

export const trainingMarkersQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month 格式需為 YYYY-MM"),
});

export const trainingsByDateQuerySchema = z.object({
  date: z.iso.date("date 格式需為 YYYY-MM-DD"),
});

export type CreateTrainingInput = z.infer<typeof createTrainingSchema>;
export type UpdateTrainingInput = z.infer<typeof updateTrainingSchema>;
export type TrainingMarkersQueryInput = z.infer<
  typeof trainingMarkersQuerySchema
>;
export type TrainingsByDateQueryInput = z.infer<
  typeof trainingsByDateQuerySchema
>;
