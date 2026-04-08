// src/routes/auth.ts
// Auth 路由：只做路由定義與 middleware 綁定
// 職責分明：route 檔不寫邏輯，邏輯在 controller 與 service

import { Router } from "express";
import {
  googleAuth,
  googleAuthCallback,
  getMe,
  logout,
} from "../controllers/authController";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

// GET /auth/google — 導向 Google OAuth 同意頁
router.get("/google", googleAuth);

// GET /auth/google/callback — Google 回調
router.get("/google/callback", googleAuthCallback);

// GET /auth/callback — 向後相容舊版 callback 路徑
router.get("/callback", googleAuthCallback);

// GET /auth/me — 取得目前使用者（cookie 或 header 驗證）
router.get("/me", authenticate, getMe);

// POST /auth/logout — 清除 cookie
router.post("/logout", logout);

export default router;
