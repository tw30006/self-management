// src/services/authService.ts
// Service 層：負責業務邏輯與資料庫操作
// 重要原則：這裡不碰 req/res，只處理資料並回傳結果或拋出錯誤
//
// 為什麼要分 service 層？
// - Controller 只負責「接收請求、呼叫 service、回傳結果」
// - Service 才負責「做事」，這樣 controller 很薄、邏輯集中好測試

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpError";
import type { RegisterInput, LoginInput } from "../models/auth";

const BCRYPT_ROUNDS = 12; // 越高越安全但越慢，12 是一般建議值

// 註冊新使用者
export async function registerUser(input: RegisterInput) {
  // 1. 檢查 email 是否已被使用（避免 409 Conflict）
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new HttpError(409, "此 email 已被註冊", "EMAIL_CONFLICT");
  }

  // 2. 用 bcrypt 雜湊密碼（絕不儲存明文）
  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  // 3. 建立使用者
  const user = await prisma.user.create({
    data: { email: input.email, password: hashedPassword },
    select: { id: true, email: true, createdAt: true }, // 不回傳 password hash
  });

  return user;
}

// 使用者登入，成功回傳 JWT token
export async function loginUser(input: LoginInput) {
  const secret = process.env.JWT_SECRET;
  if (!secret)
    throw new HttpError(500, "Server configuration error", "CONFIG_ERROR");

  // 1. 查找使用者
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // 2. 驗證密碼（即使找不到 user 也要執行 compare，避免 timing attack）
  const valid = user
    ? await bcrypt.compare(input.password, user.password)
    : false;

  if (!user || !valid) {
    // 故意用模糊訊息，不讓攻擊者知道是 email 還是密碼錯
    throw new HttpError(401, "email 或密碼不正確", "INVALID_CREDENTIALS");
  }

  // 3. 簽發 JWT，payload 只存 userId（最小權限原則）
  const token = jwt.sign({ userId: user.id }, secret, { expiresIn: "7d" });

  return { token, user: { id: user.id, email: user.email } };
}
