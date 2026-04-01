---
name: OAuth
description: 依序執行 Google OAuth 登入 API 實作（後端）
---

# Google OAuth 登入 API 實作流程（Backend）

使用時機

- 你已完成 Google Console 設定（Consent Screen、OAuth Client、Redirect URI）。
- 你已準備好 .env（GOOGLE_CLIENT_ID、GOOGLE_CLIENT_SECRET、GOOGLE_CALLBACK_URL、JWT_SECRET、DATABASE_URL）。
- 你要把既有 auth 從 email/password 改為 Google OAuth only。

目標

- 僅支援 Google OAuth 登入。
- callback 成功後由後端簽發 JWT。
- 受保護路由繼續使用 `Authorization: Bearer <token>`。
- API 回傳格式維持：`{ success, data, error }`。

## Step 0: 啟動前檢查

1. 確認環境變數皆有值。
2. 確認 callback URL 與 Google Console 的 redirect URI 完全一致。
3. 確認資料庫可連線。

完成條件

- server 啟動時不出現缺少設定的錯誤。

## Step 1: 調整 Prisma User 模型

1. 修改 `prisma/schema.prisma` 的 `User` 模型，改為 Google 欄位：

- `email`（unique）
- `name`（可選或必填，依需求）
- `googleId`（unique）
- `createdAt`

2. 移除 password 欄位與相關依賴。
3. 產生 migration 並套用。

完成條件

- `users` 表可保存 Google 帳號資料，不再依賴密碼。

## Step 2: 重寫 Auth 路由

1. 移除或停用：

- `POST /auth/register`
- `POST /auth/login`

2. 新增：

- `GET /auth/google`：導向 Google consent page。
- `GET /auth/google/callback`：處理 Google 回調。

完成條件

- `/auth/google` 能正確 redirect。

## Step 3: 實作 OAuth Controller 與 Service

1. `GET /auth/google`

- 產生 Google 授權 URL（scope 至少 `openid email profile`）。
- 回傳 redirect。

2. `GET /auth/google/callback`

- 讀取 query `code`。
- 以 `code` 向 Google 換取 token。
- 以 token 取得使用者 profile（email、name、sub/googleId）。
- 以 `googleId` 或 `email` 做 upsert user。
- 簽發 JWT（payload 至少含 `userId`）。
- 回傳 token（JSON）或 redirect 前端（擇一固定）。

完成條件

- callback 成功可取得 JWT。

## Step 4: 維持受保護路由相容

1. 保留 `authenticate` middleware 的 JWT 驗證邏輯。
2. 確認 `req.user.userId` 注入流程不變。
3. 驗證 `/trainings` 等既有路由無需大改。

完成條件

- 使用 callback 拿到的 token 可呼叫受保護路由。

## Step 5: 錯誤處理與回傳一致性

1. 缺 `code`、換 token 失敗、Google profile 解析失敗要有明確錯誤碼。
2. 所有錯誤都經過統一 error handler。
3. 回傳格式維持 `{ success, data, error }`。

完成條件

- 成功/失敗回應格式一致。

## Step 6: 測試（Jest + Supertest）

1. 新增 OAuth callback 成功測試：

- mock Google token/profile 交換流程。
- 驗證回傳 `token` 與 user 資料建立/更新。

2. 新增 OAuth callback 失敗測試：

- 缺 `code`
- 無效 `code`
- Google API 錯誤

3. 保留授權測試：

- 帶 token 存取 `/trainings` 成功
- 不帶 token 回 401

完成條件

- `auth.test.ts` 與 `trainings.test.ts` 主要路徑全綠。

## Step 7: 文件更新

1. 更新 README：

- Google OAuth 設定步驟
- 必要 env 清單
- 本機測試流程

2. 更新 `.env.example`：加入 Google 欄位。
3. 註明「不支援傳統註冊/密碼登入」。

完成條件

- 新開發者可依 README 完成本機登入流程。

## 建議執行順序（不可跳步）

1. Step 0
2. Step 1
3. Step 2
4. Step 3
5. Step 4
6. Step 5
7. Step 6
8. Step 7

## 驗收清單

1. `/auth/google` 可導向 Google。
2. `/auth/google/callback` 成功簽發 JWT。
3. JWT 可存取受保護路由。
4. 未授權請求回 401 且格式正確。
5. 測試通過且 README 已更新。
