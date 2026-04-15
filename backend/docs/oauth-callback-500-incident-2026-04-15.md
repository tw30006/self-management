# OAuth Callback 500 錯誤紀錄（2026-04-15）

## 現象

- 本地端 Google OAuth callback 出現 500。
- 錯誤回應：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Invalid `prisma.user.upsert()` invocation in /app/src/services/authService.ts:102:34"
  }
}
```

- 後端容器 log 額外顯示：`code: 'ECONNREFUSED'`。

## 影響範圍

- 影響路由：`GET /auth/callback` 與 `GET /auth/google/callback`（兩者共用同一支 handler）。
- 影響功能：Google 登入 callback 階段建立/更新使用者（`prisma.user.upsert()`）失敗。

## 根因

- Backend 在 `src/app.ts` 啟動時會讀取 `.env` 與 `.env.local`。
- 在 Docker Compose 環境中，Compose 原本已注入 `DATABASE_URL`（主機應為 `db`）。
- 但 `.env.local` 覆蓋了該值，使容器內最終連到 `localhost:5432`。
- 對容器而言，`localhost` 是容器自己，不是 Postgres 服務，因此 Prisma 連線被拒絕（`ECONNREFUSED`）。

## 修正

1. 調整 `src/app.ts` 的環境變數載入策略：
   - 保留外部注入（Docker/CI/平台）值。
   - 再讀取 `.env`、`.env.local`。
   - 最終優先序：外部注入 > `.env.local` > `.env`。
2. 驗證容器內實際連線主機為 `db:5432`。
3. 驗證容器內 Prisma `user.upsert()` 可成功執行。

## 為什麼部屬前可以，部屬後更動就壞了

- 以前若直接在主機跑 backend，`localhost:5432` 是正確的。
- 這次在容器內執行 backend，若仍吃到 `localhost:5432` 就會失敗。
- 因此不是 OAuth 流程突然壞掉，而是執行環境和 `DATABASE_URL` 優先序衝突。

## 預防清單

- 主機模式（非 Docker）才使用 `DATABASE_URL=...@localhost:5432...`。
- Docker 模式的 backend 必須使用 `DATABASE_URL=...@db:5432...`。
- 不要讓 `.env.local` 無意間覆蓋 Docker 注入的 `DATABASE_URL`。
- Google Console 的 callback URI 必須與 `GOOGLE_CALLBACK_URL` 完全一致。
