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

type JwtAuthPayload = {
  userId?: unknown;
  id?: unknown;
};

function toPositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

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

  // 支援從 Authorization header 或 httpOnly cookie 讀取 token
  let token: string | undefined;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else if ((req as any).cookies && (req as any).cookies.token) {
    token = (req as any).cookies.token;
  }

  if (!token) {
    return next(
      new HttpError(
        401,
        "Missing or invalid Authorization header",
        "UNAUTHORIZED",
      ),
    );
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return next(
      new HttpError(500, "Server configuration error", "CONFIG_ERROR"),
    );
  }

  try {
    const payload = jwt.verify(token, secret) as JwtAuthPayload;
    const normalizedUserId = toPositiveInt(payload.userId ?? payload.id);

    if (!normalizedUserId) {
      return next(new HttpError(401, "Invalid token payload", "INVALID_TOKEN"));
    }

    req.user = { userId: normalizedUserId };
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}
