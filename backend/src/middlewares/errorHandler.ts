// src/middlewares/errorHandler.ts
// 統一錯誤處理 middleware — Express 的「最後防線」
// 所有 controller 的 next(err) 都會流到這裡
// 格式遵循 copilot-instructions.md 的回傳規範

import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // 如果是我們自己丟出的 HttpError（例如 404, 401）
  if (err instanceof HttpError) {
    res.status(err.status).json({
      success: false,
      data: null,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // 如果是 Zod 驗證失敗（通常是 400 Bad Request）
  // Zod v4 使用 .issues（v3 是 .errors）
  if (err instanceof ZodError) {
    const message = err.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    res.status(400).json({
      success: false,
      data: null,
      error: { code: "VALIDATION_ERROR", message },
    });
    return;
  }

  // 其他未預期的錯誤（500）
  // stacktrace 只在非 production 顯示，避免洩露系統細節
  const isDev = process.env.NODE_ENV !== "production";
  console.error("[UnhandledError]", err);
  res.status(500).json({
    success: false,
    data: null,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        isDev && err instanceof Error ? err.message : "Internal server error",
    },
  });
}
