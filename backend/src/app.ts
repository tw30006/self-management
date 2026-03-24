// src/app.ts
// Express app 設定集中在這裡（與 server.ts 分離）
// 好處：測試時可直接 import app，不需要實際啟動 server 監聽 port

import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import trainingsRoutes from "./routes/trainings";
import { errorHandler } from "./middlewares/errorHandler";

dotenv.config();

const app = express();

// ── Security 相關 middleware ──────────────────────────
// helmet 自動設定多個安全 HTTP headers（例如 X-Frame-Options, CSP）
app.use(helmet());

// CORS：只允許信任的來源，避免任意網站存取 API
// 生產環境應改為明確的 origin 白名單
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Body 解析 ──────────────────────────────────────────
app.use(express.json());

// ── Health check（監控系統用）────────────────────────
app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" }, error: null });
});

// ── 路由掛載 ─────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/trainings", trainingsRoutes);

// ── 404 處理 ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

// ── 統一錯誤處理（必須放最後，且有 4 個參數）────────
app.use(errorHandler);

export default app;
