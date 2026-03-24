# 後端專案架構說明

## 技術棧

| 技術 | 用途 |
|------|------|
| Express 5 | Web 框架 |
| TypeScript | 型別安全 |
| Prisma 7 | ORM（資料庫操作） |
| PostgreSQL 16 | 資料庫 |
| Zod | 請求驗證 + 型別推導 |
| JWT | 認證機制 |
| bcrypt | 密碼雜湊 |
| Jest + Supertest | 整合測試 |

---

## 根目錄設定檔

| 檔案 | 用途 |
|------|------|
| `package.json` | 定義專案依賴、scripts（dev/build/test/migrate） |
| `tsconfig.json` | TypeScript 編譯設定（target ES2020、commonjs、strict） |
| `tsconfig.test.json` | 測試專用 tsconfig，繼承主設定並加入 `@types/jest` |
| `jest.config.ts` | Jest 測試框架設定（ts-jest、測試根目錄、環境載入） |
| `prisma.config.js` | Prisma 7 專用設定檔，用 `defineConfig()` 定義 DB 連線與 migrate adapter |
| `.env` / `.env.test` | 環境變數（DATABASE_URL、JWT_SECRET、PORT），**不入版控** |
| `.env.example` | 環境變數範本，告訴開發者需要設定什麼 |
| `.gitignore` | 忽略 node_modules、dist、.env 等 |
| `.dockerignore` | Docker build 時忽略的檔案 |
| `Dockerfile.dev` | 開發用 Docker 映像（含 hot-reload） |
| `README.md` | 專案說明、API 文件、啟動教學 |

---

## `prisma/` — 資料庫定義

| 檔案 | 用途 |
|------|------|
| `schema.prisma` | 資料庫藍圖，定義 `User` 和 `Training` 兩個 model。Prisma 根據此檔產生型別與 migration |
| `migrations/` | 自動產生的 SQL migration，建立 `users` 和 `trainings` 表，含外鍵關聯 |

### Model 關係圖

```
User (1) ──── (N) Training
 ├── id
 ├── email (unique)        Training
 ├── password (bcrypt)      ├── id
 └── created_at             ├── user_id (FK → User.id)
                            ├── performed_at
                            ├── action_name
                            ├── sets, reps, weight
                            ├── heart_rate (選填)
                            ├── notes (選填)
                            └── created_at, updated_at
```

---

## `src/db/` — 資料庫連線

| 檔案 | 用途 |
|------|------|
| `prisma.ts` | 建立 PrismaClient 單例（singleton）。使用 Prisma 7 的 adapter 模式（`PrismaPg`）連線 PostgreSQL。開發環境用 `globalThis` 快取，避免 hot-reload 重複建立連線 |

---

## `src/models/` — Zod Schema（資料驗證 + 型別定義）

| 檔案 | 用途 |
|------|------|
| `auth.ts` | 定義 `registerSchema`（email + 密碼 ≥ 8 字元）和 `loginSchema`。匯出推導的 TypeScript 型別 `RegisterInput`、`LoginInput` |
| `training.ts` | 定義 `createTrainingSchema`（7 個欄位含必填/選填）和 `updateTrainingSchema`（用 `.partial()` 讓所有欄位變選填）。匯出 `CreateTrainingInput`、`UpdateTrainingInput` |

> Zod 的好處是「一處定義，同時得到驗證規則 + TypeScript 型別」，不用手動維護兩份。

---

## `src/middlewares/` — 中介軟體

| 檔案 | 做什麼 | 何時觸發 |
|------|--------|---------|
| `authenticate.ts` | 從 `Authorization: Bearer <token>` 取出 JWT，驗證後把 `userId` 放進 `req.user` | 所有 `/trainings` 路由之前 |
| `validate.ts` | 通用 Zod 驗證，接收任意 schema，對 `req.body` 做 `parse()`，失敗拋 `ZodError` | POST/PATCH 路由之前 |
| `errorHandler.ts` | 最後防線：攔截所有 `next(err)` 的錯誤，依類型回傳統一格式的 JSON 回應 | 放在 app 最後面 |

### errorHandler 判斷順序

```
err 是 HttpError？ → 回傳對應 status + code
err 是 ZodError？  → 回傳 400 + VALIDATION_ERROR
其他？            → 回傳 500（dev 環境顯示 stacktrace）
```

---

## `src/routes/` — 路由定義（薄層）

| 檔案 | 路由 | 說明 |
|------|------|------|
| `auth.ts` | `POST /auth/register`、`POST /auth/login` | 綁定 validate middleware + controller，不含邏輯 |
| `trainings.ts` | `GET/POST /trainings`、`GET/PATCH/DELETE /trainings/:id` | 先套 `authenticate`，再依需要套 `validate`，最後進 controller |

---

## `src/controllers/` — 控制器（接收請求、回傳結果）

| 檔案 | 負責 |
|------|------|
| `authController.ts` | 呼叫 `authService.registerUser()` / `loginUser()`，回傳 201 或 200 |
| `trainingsController.ts` | 呼叫 `trainingService` 的 5 個 CRUD 函式，處理分頁參數轉換與回傳 |

> Controller 很「薄」，只做 3 件事：① 取出 req 參數 ② 呼叫 service ③ 回傳 res。所有邏輯在 service。

---

## `src/services/` — 服務層（商業邏輯 + DB 操作）

| 檔案 | 函式 | 做什麼 |
|------|------|--------|
| `authService.ts` | `registerUser()` | 檢查 email 重複 → bcrypt 雜湊密碼 → 建立 user（不回傳密碼） |
| | `loginUser()` | 查 user → bcrypt 比對密碼 → 簽發 JWT（7 天有效期） |
| `trainingService.ts` | `listTrainings()` | 分頁查詢（Promise.all 並行取資料+計數） |
| | `getTraining()` | 查單筆，確認屬於該 user（防止存取他人資料） |
| | `createTraining()` | 將 snake_case 輸入轉成 camelCase 存入 DB |
| | `updateTraining()` | 先確認存在 → 部分更新 |
| | `deleteTraining()` | 先確認存在 → 刪除 |

---

## `src/utils/` — 工具

| 檔案 | 用途 |
|------|------|
| `httpError.ts` | 自訂 `HttpError` 類別，攜帶 `status`（HTTP 狀態碼）與 `code`（錯誤代碼），讓 errorHandler 統一格式化 |

---

## `src/` — 應用程式進入點

| 檔案 | 用途 |
|------|------|
| `app.ts` | Express app 組裝：載入 helmet → cors → body parser → 路由 → 404 → errorHandler |
| `server.ts` | 只負責 `app.listen(PORT)`，啟動 HTTP server |

> 為什麼分開？測試時直接 `import app`，不需要實際啟動 server 監聽 port。

---

## `tests/` — 整合測試

| 檔案 | 測試內容 | 案例數 |
|------|---------|--------|
| `setup.ts` | 載入 `.env.test`，確保 `JWT_SECRET` 有值 | — |
| `auth.test.ts` | 註冊成功 / 重複 email 409 / 密碼太短 400 / 登入成功 / 錯誤密碼 401 / 不存在 email 401 | 6 |
| `trainings.test.ts` | 建立成功 201 / 未帶 token 401 / 缺欄位 400 / 列表分頁 / 取單筆 / 404 / 部分更新 / 刪除 204 | 10 |

---

## `.github/prompts/` — Copilot 提示檔

| 檔案 | 用途 |
|------|------|
| `training.prompt.md` | Training API 的完整實作規格書（9 個步驟） |
| `copilot-instructions.md` | 團隊 coding style 規範，Copilot 產生程式碼時遵循 |

---

## 請求流程圖

```
Client Request
    │
    ▼
  app.ts ── helmet / cors / json parser
    │
    ▼
  routes/ ── 路由比對
    │
    ├── authenticate middleware（驗 JWT）
    ├── validate middleware（驗 body）
    │
    ▼
  controllers/ ── 取參數、呼叫 service
    │
    ▼
  services/ ── 商業邏輯 + Prisma DB 操作
    │
    ▼
  controllers/ ── 回傳 JSON 給 client
    │
    │  （如果出錯）
    ▼
  errorHandler ── 統一格式化錯誤回應
```

---

## API 回傳統一格式

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

```json
{
  "success": false,
  "data": null,
  "error": { "code": "VALIDATION_ERROR", "message": "..." }
}
```

---

## training.prompt.md 完成度

| # | 步驟 | 狀態 |
|---|------|------|
| 1 | Scaffold 專案 | ✅ |
| 2 | 安裝依賴 | ✅ |
| 3 | Prisma schema + migration | ✅ |
| 4 | DB 連線 (`src/db/prisma.ts`) | ✅ |
| 5 | Auth (register/login/JWT) | ✅ |
| 6 | Trainings CRUD + zod | ✅ |
| 7 | Error handling | ✅ |
| 8 | Tests (16 個測試案例) | ✅ |
| 9 | Scripts & README | ✅ |
