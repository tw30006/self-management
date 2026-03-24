# Training API Implementation Prompt (繁體中文)

目標
- 建立 TypeScript + Express 後端，使用 PostgreSQL 與 Prisma ORM，並加入 JWT 認證。實作 trainings 資源的 CRUD API，用來記錄每次訓練資料。

需求
- 資料欄位：performed_at (timestamp), action_name (string), sets (int), reps (int), weight (decimal), heart_rate (int), notes (text)
- 使用 Prisma 管理 DB schema 與 migration
- 使用 JWT 作為驗證機制（含 users table 與 /auth/register、/auth/login）
- API 回傳統一格式：{ success: boolean, data: any|null, error: { code?: string, message: string } | null }
- 使用 zod 做 request payload 驗證
- 測試使用 jest + supertest

實作步驟
1. Scaffold 專案（TypeScript、ESLint、Prettier、scripts）
2. 安裝依賴：express, prisma, @prisma/client, jsonwebtoken, bcrypt, zod, dotenv, pg, jest, supertest, ts-node-dev
3. Prisma: 定義 schema（User、Training），執行 migrate
4. DB 連線：src/db/prisma.ts
5. Auth：routes/controllers/services/middleware，實作註冊、登入、JWT 驗證
6. Trainings CRUD：routes/controllers/services，並加入 zod 驗證 middleware
7. Error handling：統一錯誤格式 middleware
8. Tests：整合測試覆蓋主要路由
9. Scripts & README：啟動、遷移、測試教學

env
- .env: DATABASE_URL, JWT_SECRET, PORT

交付物
- 程式碼、Prisma migration、README、tests

說明
- 該檔案放在 .github\prompts 方便版本控制與後續自動化使用
