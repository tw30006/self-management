# Backend Auth API 規格書

## 1. 文件目的
本文件定義目前後端登入與授權機制（Auth）之實作規格，作為前後端協作、測試與後續擴充的共同依據。

## 2. 範圍與非範圍
### 範圍
- Google OAuth 登入流程
- JWT 簽發與驗證規格
- Auth 相關 API 契約
- Auth 相關資料欄位與錯誤格式
- Auth 測試覆蓋現況

### 非範圍
- 傳統帳密註冊與登入（本專案不提供）
- Trainings CRUD 詳細規格（僅作為受保護路由驗證範例）

## 3. 系統設計現況
- 授權方式：Google OAuth 2.0 + JWT
- 使用者模型：以 `users` 表儲存 Google 使用者資訊
- Token 型態：Bearer JWT（有效期 7 天）
- API 回傳格式統一：

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

失敗回應：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤訊息"
  }
}
```

## 4. 登入流程規格
### 4.1 流程總覽
1. 前端導向 `GET /auth/google`。
2. 後端產生隨機 `state`，存入短效 httpOnly cookie（`oauth_state`），再組出 Google OAuth URL 並回傳 302 Redirect。
3. 使用者在 Google 完成同意後，Google 轉址到 `GET /auth/google/callback?code=...&state=...`。
4. 後端以 code 向 Google 換取 access token。
5. 後端用 access token 取得 Google user profile。
6. 後端以 email 做 upsert（更新或建立）使用者資料。
7. 後端簽發 JWT，回傳 `{ token, user }`。

### 4.2 呼叫鏈（Route -> Controller -> Service）
- `GET /auth/google`
  - Route: `src/routes/auth.ts`
  - Controller: `googleAuth`
  - Service: `buildGoogleOAuthUrl`
- `GET /auth/google/callback`
  - Route: `src/routes/auth.ts`
  - Controller: `googleAuthCallback`
  - Validation: `googleCallbackQuerySchema`（驗證 query.code）
  - Service: `loginWithGoogleCode`

### 4.3 JWT 驗證流程（受保護路由）
1. 讀取 `Authorization` header，格式必須為 `Bearer <token>`。
2. 使用 `JWT_SECRET` 驗證 JWT。
3. 驗證成功後將 `userId` 注入 `req.user.userId`。
4. 驗證失敗回傳 401（`UNAUTHORIZED` 或 `INVALID_TOKEN`）。

### 4.4 OAuth callback state 驗證流程（防 CSRF）
1. `GET /auth/google` 產生隨機 `state`，存入 cookie `oauth_state`（短效）。
2. 導向 Google 時，將 `state` 作為 query param 傳出。
3. callback 時比對 `req.query.state` 與 `req.cookies.oauth_state`。
4. 比對失敗回傳 `400 INVALID_OAUTH_STATE`，成功則清除 `oauth_state` cookie 並繼續 code exchange。

## 5. 資料模型與欄位
## 5.1 User（Prisma: users）
| 欄位 | 型別 | 必填 | 約束/預設 | 說明 |
|---|---|---|---|---|
| id | Int | 是 | PK, auto increment | 使用者主鍵 |
| email | String | 是 | UNIQUE | Google 帳號 email |
| name | String? | 否 | nullable | 顯示名稱 |
| googleId | String? | 否 | UNIQUE, map `google_id` | Google user sub |
| createdAt | DateTime | 是 | default now(), map `created_at` | 建立時間 |

備註：
- 歷史 migration 初版曾有 `password` 欄位，後續已移除並改為 Google OAuth 欄位。

## 6. Auth API 契約
## 6.1 GET /auth/google
- 用途：導向 Google OAuth 同意頁。
- 驗證：不需 JWT。
- Request
  - Params: 無
  - Query: 無
  - Body: 無
- Response
  - Status: `302 Found`
  - Header: `Location: https://accounts.google.com/o/oauth2/v2/auth?...`

## 6.2 GET /auth/google/callback
- 用途：處理 Google callback，建立/更新使用者並簽發 JWT。
- 驗證：不需 JWT。
- Request
  - Query
    - `code: string`（必填）
- Success Response
  - Status: `200 OK`

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name",
      "createdAt": "2026-04-08T00:00:00.000Z"
    }
  },
  "error": null
}
```

- Error Response（常見）
  - `400 VALIDATION_ERROR`：缺少 code 或格式不合法
  - `400 INVALID_OAUTH_STATE`：callback state 驗證失敗
  - `401 GOOGLE_TOKEN_EXCHANGE_FAILED`：向 Google 換 token 失敗
  - `401 GOOGLE_TOKEN_INVALID`：Google token payload 無效
  - `401 GOOGLE_PROFILE_FETCH_FAILED`：Google profile 取得失敗
  - `401 GOOGLE_PROFILE_INVALID`：Google profile 欄位缺漏（無 sub/email）
  - `500 CONFIG_ERROR`：伺服器缺少必要環境變數

## 6.3 GET /auth/me
- 用途：回傳目前已驗證的使用者資訊（由 `authenticate` middleware 驗證 token，支援 header 或 httpOnly cookie）。
- 驗證：需要驗證（Authorization header 或 httpOnly cookie）
- Request
  - Headers/Cookies: `Authorization: Bearer <token>` 或 cookie `token` (httpOnly)
- Success Response
  - Status: `200 OK`
  - Body: `{ success: true, data: { id, email, name, createdAt }, error: null }`
- Error Response
  - `401 UNAUTHORIZED`：未帶 token 或 token 無效
  - `404 USER_NOT_FOUND`：token 有效但使用者不存在

## 6.4 POST /auth/logout
- 用途：登出（從瀏覽器清除 httpOnly token cookie）
- 驗證：不必需（前端可直接呼叫）
- Request
  - Body: 無
- Success Response
  - Status: `200 OK`
  - Body: `{ success: true, data: null, error: null }`

## 7. 驗證與錯誤處理
## 7.1 請求驗證
- Auth callback 使用 Zod 驗證 query：`code` 必填。
- 目前 `validate` middleware 主要驗證 request body；Auth callback 在 controller 內直接 parse query。

## 7.2 錯誤處理策略
- 業務錯誤使用 `HttpError(status, message, code)` 丟出。
- `errorHandler` 會統一轉成回應格式 `{ success: false, data: null, error }`。
- ZodError 會被轉為 `400 VALIDATION_ERROR`。
- 其他未預期錯誤為 `500 INTERNAL_SERVER_ERROR`。

## 8. 必要環境變數
| 變數 | 用途 |
|---|---|
| GOOGLE_CLIENT_ID | 建立 OAuth URL 與 token exchange |
| GOOGLE_CLIENT_SECRET | token exchange |
| GOOGLE_CALLBACK_URL | Google callback redirect_uri |
| JWT_SECRET | JWT 簽發與驗證 |
| DATABASE_URL | Prisma 連線資料庫 |

## 9. 安全規格
- 所有需要登入的路由必須加上 `authenticate` middleware。
- Token 必須以 `Authorization: Bearer <token>` 傳遞。
- 不可在程式碼硬編碼 OAuth 憑證與 JWT secret。
- CORS 由後端限制來源，預設 fallback 為 `http://localhost:5173`。
 - 後端支援把 JWT 放到 `httpOnly` cookie（推薦），已更新 CORS 以允許跨站 cookie（`credentials: true`）。前端呼叫 API 時需帶上 credentials（`fetch(..., { credentials: 'include' })`）。

## 10. 與受保護路由整合
- Auth 完成後，前端使用 callback 回傳的 JWT 呼叫受保護路由。
- 目前受保護路由代表案例為 `trainings` 系列 API。
- 若未帶 token 或 token 無效，API 應回傳 401。

## 11. 測試覆蓋現況（Auth）
已覆蓋：
- `GET /auth/google` 會正確 302 導向 Google
- `GET /auth/google/callback` 缺少 code 回 400
- `GET /auth/google/callback` token exchange 失敗回 401
- `GET /auth/google/callback` 成功時回傳 JWT 與 user，並驗證 DB upsert

尚未明確覆蓋：
- JWT 過期情境
- callback 成功後「既有使用者更新分支」的完整測試
- Google profile payload 異常的細項分支

## 12. 目前限制與後續建議
- 僅有 access token（JWT），尚未提供 refresh token 機制。
- 尚未提供 `GET /auth/me` 以供前端驗證當前 session。
- 若要提升安全性，建議加入 auth endpoint 的 rate limiting。
- 若要提升前端整合體驗，建議定義 callback 後的 redirect/token 傳遞策略（純 JSON 或 redirect with code/token）。

## 13. 參考實作檔案
- `src/routes/auth.ts`
- `src/controllers/authController.ts`
- `src/services/authService.ts`
- `src/models/auth.ts`
- `src/middlewares/authenticate.ts`
- `src/middlewares/errorHandler.ts`
- `src/utils/httpError.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260324061241_init/migration.sql`
- `prisma/migrations/20260407000100_google_oauth_auth/migration.sql`
- `tests/auth.test.ts`
