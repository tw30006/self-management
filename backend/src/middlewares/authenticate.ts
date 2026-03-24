// src/middlewares/authenticate.ts
// JWT 認證 middleware — 保護需要登入才能存取的路由
// 用法：router.get('/trainings', authenticate, controller)
//
// 運作流程：
// 1. 從 request header 的 Authorization 取出 Bearer token
// 2. 用 JWT_SECRET 驗證 token 是否有效
// 3. 把解碼後的 userId 放到 req.user，讓後續 controller 使用
// 4. 若 token 無效或過期，回傳 401

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../utils/httpError";

// 擴充 Express 的 Request 型別，加入 user 欄位
declare global {
  namespace Express {
    interface Request {
      user?: { userId: number };
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(
      new HttpError(
        401,
        "Missing or invalid Authorization header",
        "UNAUTHORIZED",
      ),
    );
  }

  const token = authHeader.slice(7); // 去掉 "Bearer " 前綴
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    // JWT_SECRET 未設定屬於設定錯誤，不應在 production 發生
    return next(
      new HttpError(500, "Server configuration error", "CONFIG_ERROR"),
    );
  }

  try {
    const payload = jwt.verify(token, secret) as { userId: number };
    req.user = { userId: payload.userId };
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}
