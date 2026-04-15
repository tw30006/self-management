# Self-Management Backend API

TypeScript + Express + Prisma + PostgreSQL 後端 API  
提供訓練紀錄（Training）的 CRUD，並使用 JWT 進行身份驗證。

## 技術棧

| 類別 | 套件 |
|------|------|
| 框架 | Express 5 |
| 語言 | TypeScript |
| ORM | Prisma 7 |
| 資料庫 | PostgreSQL 16 |
| 驗證 | Google OAuth + jsonwebtoken |
| Schema 驗證 | Zod |
| 測試 | Jest + supertest |

---

## 目錄結構

```
backend/
├── prisma/
│   └── schema.prisma       # 資料庫 schema（User、Training）
├── src/
│   ├── db/
│   │   └── prisma.ts       # PrismaClient singleton
│   ├── routes/             # 路由定義（薄，只綁定 controller）
│   ├── controllers/        # 接收 req、呼叫 service、回傳 res
│   ├── services/           # 商業邏輯 + 資料庫操作
│   ├── middlewares/        # authenticate, validate, errorHandler
│   ├── models/             # Zod schema（型別定義 + 驗證規則）
│   ├── utils/
│   │   └── httpError.ts    # 自訂錯誤類別
│   ├── app.ts              # Express app 設定
│   └── server.ts           # HTTP server 進入點
└── tests/                  # 整合測試
```

---

## 快速開始

### 1. 設定環境變數

```bash
cp .env.example .env.local
```

編輯 `.env.local`，填入你的資料庫連線資訊：

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/self_management?schema=public"
JWT_SECRET="your-very-secret-key-here"   # 請使用隨機長字串
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:8080/auth/callback"
PORT=8080
NODE_ENV=development
```

> **安全提醒**：`.env.local` 已加入 `.gitignore`，請勿提交到版本控制。

### 2. 安裝依賴

```bash
npm install
```

### 3. 執行資料庫 Migration

```bash
npm run db:migrate
```

這個指令會：
1. 根據 `prisma/schema.prisma` 建立/更新資料庫表格
2. 自動產生 Prisma Client 的 TypeScript 型別

### 4. 啟動開發伺服器

```bash
npm run dev
```

Server 啟動後可訪問：`http://localhost:8080`

---

## 使用 Docker Compose 啟動（含資料庫）

在專案根目錄執行：

```bash
docker compose up --build db backend
```

資料庫會自動啟動，但 migration 需要手動執行一次：

```bash
docker compose exec backend npx prisma migrate dev
```

### Docker 與本機環境變數注意事項（重要）

- 主機直接跑 backend（`npm run dev`）時，`DATABASE_URL` 應使用 `localhost`。
- Docker 跑 backend 時，`DATABASE_URL` 應使用 `db`（由 Compose 注入），不可使用 `localhost`。
- 本專案已在 `src/app.ts` 處理載入優先序，預設為：外部注入 > `.env.local`。
- 如果 OAuth callback 出現 `prisma.user.upsert()` 的 `ECONNREFUSED`，優先檢查 backend 實際吃到的 `DATABASE_URL` host 是否為 `db`。

---

## API 文件

### 統一回傳格式

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

失敗時：

```json
{
  "success": false,
  "data": null,
  "error": { "code": "ERROR_CODE", "message": "說明訊息" }
}
```

---

### 健康檢查

```
GET /health
```

---

### Auth

本專案僅支援 Google OAuth 登入，不提供傳統註冊/密碼登入。

#### Google 登入入口

```
GET /auth/google
```

呼叫後會 redirect 到 Google Consent Page。

#### Google Callback

```
GET /auth/google/callback?code=<google_auth_code>
```

> 相容路徑：`GET /auth/callback` 也會導向同一段 callback handler。

成功回傳 `200`，`data` 內容如下：

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Your Name",
    "createdAt": "2026-04-07T00:00:00.000Z"
  }
}
```

失敗時會以統一格式回傳錯誤，例如 `GOOGLE_TOKEN_EXCHANGE_FAILED`。

---

### Trainings（需要 JWT）

所有 Training API 都需要在 Header 帶上：

```
Authorization: Bearer <token>
```

#### 取得列表（支援分頁）

```
GET /trainings?page=1&limit=20
```

#### 取得單一紀錄

```
GET /trainings/:id
```

#### 建立訓練紀錄

```
POST /trainings
Content-Type: application/json

{
  "performed_at": "2024-01-15T10:00:00.000Z",
  "action_name": "深蹲",
  "sets": 3,
  "reps": 10,
  "weight": 60.5,
  "heart_rate": 130,
  "notes": "選填備注"
}
```

**欄位使用說明**

- `performed_at`: 請傳送符合 ISO 8601 的時間字串（例如 `2024-01-15T10:00:00.000Z`），後端會轉成資料庫的 `timestamp`。
- `weight`: 支援數字或字串（例如 `60.5` 或 `"60.5"`）。後端會把此欄位轉為 `Decimal` 儲存以避免浮點精度問題；若需顯式精度（例如 `60.50`），建議以字串傳送。

***

#### 部分更新

```
PATCH /trainings/:id
Content-Type: application/json

{
  "sets": 5
}
```

#### 刪除

```
DELETE /trainings/:id
```

回傳 `204 No Content`。

---

## 執行測試

測試使用真實資料庫（需要先設定 `.env.test`）：

```bash
cp .env.test.example .env.test
# 編輯 .env.test，建議使用獨立的測試資料庫
```

```bash
npm test
```

---

## Scripts 一覽

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器（熱重載） |
| `npm run build` | 編譯 TypeScript 到 `dist/` |
| `npm start` | 執行編譯後的 production build |
| `npm run db:migrate` | 執行 Prisma migration |
| `npm run db:generate` | 重新產生 Prisma Client |
| `npm run db:studio` | 開啟 Prisma Studio（視覺化 DB 管理介面） |
| `npm test` | 執行整合測試 |
