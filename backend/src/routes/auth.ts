// src/routes/auth.ts
// Auth 路由：只做路由定義與 middleware 綁定
// 職責分明：route 檔不寫邏輯，邏輯在 controller 與 service

import { Router } from "express";
import { register, login } from "../controllers/authController";
import { validate } from "../middlewares/validate";
import { registerSchema, loginSchema } from "../models/auth";

const router = Router();

// POST /auth/register — 先驗證 body，再進 controller
router.post("/register", validate(registerSchema), register);

// POST /auth/login
router.post("/login", validate(loginSchema), login);

export default router;
