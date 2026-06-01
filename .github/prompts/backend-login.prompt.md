# Auth API Implementation Prompt (繁體中文) — Google OAuth 專用

目標

- 本專案只需由使用者本人透過 Google 第三方登入，不需傳統註冊流程。實作 Google OAuth 登入流程，並於成功驗證後發行 JWT 供受保護路由使用。

主要需求

- 只支援 Google OAuth 登入：前端按鈕觸發，後端與 Google 交換授權後在 callback 發行 JWT。
- 不提供 `/auth/register` 或密碼註冊流程。
- 使用 `jsonwebtoken` 產生與驗證 JWT（env: `JWT_SECRET`）。
- API 回傳統一格式：{ success: boolean, data: any|null, error: { code?: string, message: string } | null }
- 使用 zod 做必要的 request payload 驗證（若有額外輸入欄位）。
- 測試使用 jest + supertest（包含 OAuth callback 成功流程與受保護路由驗證）。

建議資料模型

- `User` 資料表仍建議保留（至少含 `email`, `name`, `googleId`, `created_at`），用於記錄使用者及關聯 JWT 發行。但不需要 `passwordHash`。

必要環境變數

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`（或 `CLIENT_URL` + 固定 callback 路徑）
- `JWT_SECRET`
- `DATABASE_URL`

建議 API 路由

- `GET /auth/google`：導向 Google OAuth consent page（使用 `passport` 或自行組裝 URL）。
- `GET /auth/google/callback`：Google 回調，後端驗證授權 code、取得 user profile，於 DB 建或更新使用者資料，產生 JWT，最後回傳 JWT 給前端或透過 redirect/帶 token 的方式。
- 受保護路由示例：任何需要驗證的路由使用 `authenticate` middleware，該中介驗證 `Authorization: Bearer <token>` 並將 user id 注入 `request`。

實作步驟（建議）

1. 安裝或確認相依套件：`jsonwebtoken`, `zod`, `dotenv`, 以及選擇性套件 `passport`, `passport-google-oauth20`（或使用 `google-auth-library` 自行交換 token）。
2. Prisma schema：新增或更新 `User` model（`email`, `name`, `googleId`, `createdAt`），並執行 migrate。
3. 實作 OAuth 路由與 controller：
   - `GET /auth/google`：產生並導向 Google OAuth URL。
   - `GET /auth/google/callback`：取得 code -> 換取 token -> 取得 profile -> 在 DB 建/更新 user -> 產生 JWT -> 回傳給前端。
4. `authenticate` middleware：驗證 JWT、在 request 加入 `userId`。
5. Error handling：維持統一錯誤回應格式。
6. Tests：使用 jest + supertest 模擬 callback 行為（可使用 mock 或用測試用的 Google 測試憑證），驗證能拿到 JWT 並能存取受保護路由。
7. README：更新使用說明（如何設定 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`GOOGLE_CALLBACK_URL`、`JWT_SECRET`，以及如何在本地測試）。

前端提示

- 前端只需一個 "Sign in with Google" 按鈕，將使用者導向後端 `GET /auth/google`。
- 成功後從 callback 或 redirect URL 取得後端回傳的 JWT（例如透過 redirect 加上 hash 或 query，或由前端再呼叫 `/auth/me` 取得 session）。

交付物

- 修改後的 prompt（本檔案）、Auth 路由/Controller/Service、Prisma migration（User model 建議欄位）、測試範例、README 說明。

備註

- 如果只會由單一使用者使用，請在 README 建議使用 `.env` 本地設定（不要公開憑證），並可考慮使用 Google 的 OAuth 測試憑證或 "OAuth Consent Screen" 設為 internal（若為 Google Workspace）。
