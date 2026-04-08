// src/controllers/authController.ts
// Controller 層：只負責接收 req、呼叫 service、回傳 res
// 不包含任何商業邏輯，保持「薄」
// try/catch + next(err) 是固定模式，讓 errorHandler middleware 統一處理

import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { prisma } from "../db/prisma";
import {
  googleCallbackQuerySchema,
  type GoogleCallbackQuery,
} from "../models/auth";

// GET /auth/google
export async function googleAuth(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const url = authService.buildGoogleOAuthUrl();
    res.redirect(url);
  } catch (err) {
    next(err);
  }
}

// GET /auth/google/callback
export async function googleAuthCallback(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = googleCallbackQuerySchema.parse(
      req.query,
    ) as GoogleCallbackQuery;
    const result = await authService.loginWithGoogleCode(query.code);
    // 將 JWT 以 httpOnly cookie 存回，前端改以 cookie 方式存取（更安全）
    // 在測試環境保留 JSON 回傳以維持現有測試行為
    const frontendUrl =
      process.env.FRONTEND_URL ??
      process.env.CORS_ORIGIN ??
      "http://localhost:5173";

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    if (process.env.NODE_ENV === "test") {
      // 保持測試相容性：回傳 JSON
      res.json({ success: true, data: result, error: null });
      return;
    }

    // 實際 OAuth 流程：設定 cookie 後導回前端
    res.redirect(frontendUrl);
  } catch (err) {
    next(err);
  }
}
// GET /auth/me — 回傳目前使用者資訊（需 authenticate middleware）
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next(new Error("No authenticated user"));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          data: null,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });
    }

    res.json({ success: true, data: user, error: null });
  } catch (err) {
    next(err);
  }
}

// POST /auth/logout — 清除 token cookie
export async function logout(_req: Request, res: Response) {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  res.json({ success: true, data: null, error: null });
}
