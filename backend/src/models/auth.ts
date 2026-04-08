// src/models/auth.ts
// Zod schema — 定義 Google OAuth callback 的 query 格式

import { z } from "zod";

export const googleCallbackQuerySchema = z.object({
  code: z.string().min(1, "缺少授權 code"),
});

export type GoogleCallbackQuery = z.infer<typeof googleCallbackQuerySchema>;
