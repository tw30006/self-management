// src/models/auth.ts
// Zod schema — 定義 auth 相關 API 的請求體格式
// Zod 好處：宣告式、自動產生 TypeScript 型別、失敗訊息夠清楚

import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("請輸入有效的 email 格式"),
  password: z.string().min(8, "密碼至少需要 8 個字元"),
});

export const loginSchema = z.object({
  email: z.string().email("請輸入有效的 email 格式"),
  password: z.string().min(1, "密碼不能為空"),
});

// 從 schema 自動推導 TypeScript 型別，不用手動維護
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
