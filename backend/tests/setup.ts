// tests/setup.ts
// 測試前的初始化設定
// Jest 的 setupFiles 會在每個測試套件執行前跑這個檔案

import dotenv from "dotenv";
import path from "path";

// 載入 .env.test（測試專用環境變數）
// 如果沒有 .env.test，fallback 到一般的 .env
dotenv.config({
  path: path.resolve(__dirname, "..", ".env.test"),
});

// 確保 JWT_SECRET 測試時有值
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-secret-key-for-jest";
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "test";
}

if (!process.env.GOOGLE_CLIENT_ID) {
  process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
}

if (!process.env.GOOGLE_CALLBACK_URL) {
  process.env.GOOGLE_CALLBACK_URL =
    "http://localhost:8080/auth/google/callback";
}
