// src/controllers/authController.ts
// Controller 層：只負責接收 req、呼叫 service、回傳 res
// 不包含任何商業邏輯，保持「薄」
// try/catch + next(err) 是固定模式，讓 errorHandler middleware 統一處理

import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";
import type { RegisterInput, LoginInput } from "../models/auth";

// POST /auth/register
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await authService.registerUser(req.body as RegisterInput);
    res.status(201).json({ success: true, data: user, error: null });
  } catch (err) {
    next(err);
  }
}

// POST /auth/login
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.loginUser(req.body as LoginInput);
    res.json({ success: true, data: result, error: null });
  } catch (err) {
    next(err);
  }
}
