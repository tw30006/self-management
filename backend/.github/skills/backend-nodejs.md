---
description: Node.js + Express RESTful API 領域知識，包含專案架構、設計模式、安全性、測試等詳細說明與範例。USE FOR：建立新路由、controller、service；錯誤處理模式；安全性設計；撰寫測試；分頁 API 設計。
---

# Node.js + Express RESTful API 知識庫

本檔案為詳細的領域知識與程式碼範例，供 Copilot 在需要時參照。

---

## 專案目錄結構

```
src/
├── routes/        # 路由定義（只做綁定，不含邏輯）
├── controllers/   # 處理 req/res，呼叫 service
├── services/      # 商業邏輯、資料存取
├── models/        # TypeScript interface 或 ORM model
├── middlewares/   # 共用 middleware
│   ├── authenticate.ts   # JWT 驗證
│   ├── validate.ts       # 輸入驗證
│   └── errorHandler.ts   # 中央錯誤處理
└── utils/         # 工具函式（例如 HttpError）
```

---

## 完整範例：routes → controller → service

```ts
// src/routes/users.ts
// 路由層：只做路徑與函式的對應，不寫邏輯
import express from "express";
import { getUsers, createUser } from "../controllers/usersController";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import { createUserSchema } from "../models/user";

const router = express.Router();

router.get("/", authenticate, getUsers);          // 需登入才能取得列表
router.post("/", validate(createUserSchema), createUser); // 先驗證再建立

export default router;
```

```ts
// src/controllers/usersController.ts
// Controller 層：接收 req、呼叫 service、回傳 res
// 所有錯誤交給 next(err)，不要在這裡直接回傳 500
import { Request, Response, NextFunction } from "express";
import * as userService from "../services/userService";

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 把 query 參數傳給 service 處理分頁邏輯
    const result = await userService.list(req.query);
    res.json({ success: true, data: result, error: null });
  } catch (err) {
    next(err); // 交給 errorHandler middleware
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.create(req.body);
    res.status(201).json({ success: true, data: user, error: null });
  } catch (err) {
    next(err);
  }
};
```

```ts
// src/services/userService.ts
// Service 層：商業邏輯與資料存取，不操作 req/res
// 設計成不依賴 Express，方便做單元測試
import prisma from "../db/prisma";
import { HttpError } from "../utils/httpError";

interface ListQuery {
  page?: string;
  limit?: string;
}

export const list = async (query: ListQuery) => {
  // 分頁邏輯：預設第 1 頁，每頁 20 筆
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.user.findMany({ skip, take: limit }),
    prisma.user.count(),
  ]);

  return { data, total, page, limit };
};

export const create = async (body: { email: string; name: string }) => {
  // 檢查 email 是否已存在
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    // 拋出自訂錯誤（攜帶 HTTP 狀態碼，由 errorHandler 處理）
    throw new HttpError(409, "EMAIL_CONFLICT", "此 email 已被註冊");
  }
  return prisma.user.create({ data: body });
};
```

---

## HTTP 狀態碼規範

| 情境                 | 狀態碼 |
| -------------------- | ------ |
| 成功讀取/更新        | 200    |
| 建立成功             | 201    |
| 刪除成功（無回傳）   | 204    |
| 驗證失敗             | 400    |
| 未登入               | 401    |
| 無權限               | 403    |
| 資源不存在           | 404    |
| 資料衝突（例如重複） | 409    |
| 語意驗證失敗         | 422    |
| 伺服器錯誤           | 500    |


---

## 錯誤處理模式

### 自訂 HttpError

```ts
// src/utils/httpError.ts
// 攜帶 status code 與 code 字串，讓 errorHandler 能正確回應
export class HttpError extends Error {
  constructor(
    public status: number,   // HTTP 狀態碼，例如 404
    public code: string,     // 錯誤代號，例如 "NOT_FOUND"
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}
```

### 中央錯誤處理 Middleware

```ts
// src/middlewares/errorHandler.ts
// 所有 next(err) 都會到這裡，統一格式化回應
import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction // Express 要求 4 個參數才會被視為錯誤 middleware
) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      success: false,
      data: null,
      error: { code: err.code, message: err.message },
    });
  }

  // 非預期錯誤：production 不顯示 stack trace，避免洩漏資訊
  const isDev = process.env.NODE_ENV !== "production";
  console.error(err);

  res.status(500).json({
    success: false,
    data: null,
    error: {
      code: "INTERNAL_ERROR",
      message: "伺服器發生錯誤",
      ...(isDev && { stack: err instanceof Error ? err.stack : String(err) }),
    },
  });
};
```

---

## 驗證 Middleware（使用 zod）

```ts
// src/middlewares/validate.ts
// 接收 zod schema，回傳可重用的 middleware
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    // 把 zod 的錯誤格式化成統一格式
    const message = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    return res.status(400).json({
      success: false,
      data: null,
      error: { code: "VALIDATION_ERROR", message },
    });
  }
  req.body = result.data; // 用 zod 清洗後的資料取代原始輸入
  next();
};
```

---

## 日誌與監控

```ts
// 使用 pino 做結構化日誌（輸出 JSON 格式，方便 log aggregator 解析）
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});

// 記錄請求時，加入 requestId、userId 等識別欄位
logger.info({ requestId, userId, path: req.path, status: res.statusCode }, "request finished");
```

---

## 安全性建議

### Helmet（設定安全 HTTP header）

```ts
import helmet from "helmet";
app.use(helmet()); // 一行搞定常見的安全 header 設定
```

### CORS（限制允許來源）

```ts
import cors from "cors";
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN, // 從環境變數讀取，不要硬編碼
  credentials: true,
}));
```

### 密碼雜湊

```ts
import bcrypt from "bcrypt";

// 儲存密碼前雜湊（saltRounds 建議 10~12）
const hashedPassword = await bcrypt.hash(plainPassword, 12);

// 驗證密碼
const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
```

---

## Secrets 管理規範

- **禁止**在程式碼裡硬編碼任何密鑰，範例：
  ```ts
  // ❌ 錯誤
  const secret = "my-super-secret-key";
  
  // ✅ 正確
  const secret = process.env.JWT_SECRET; // 從環境變數讀取
  ```
- 本地開發使用 `.env` 搭配 `dotenv`，但 `.env` 必須加入 `.gitignore`。
- 生產環境使用 secrets 管理器（AWS Secrets Manager、GCP Secret Manager 等）。
- 日誌中**不得**輸出密碼、token、信用卡等敏感資料。
- Token 應設定有效期限，並定期輪替。

---

## 效能與分頁

列表 API 必須支援分頁，建議使用 `cursor` 分頁（效能較佳）或 `page/limit`：

```ts
// cursor-based 分頁回應範例
res.json({
  success: true,
  data: {
    items: [...],
    nextCursor: "some-id", // 下一頁起點，null 表示已是最後一頁
  },
  error: null,
});

// page/limit 分頁回應範例
res.json({
  success: true,
  data: {
    items: [...],
    total: 100,
    page: 2,
    limit: 20,
  },
  error: null,
});
```

---

## 測試策略

- **單元測試**：測試 service 層（mock prisma），驗證商業邏輯是否正確。
- **整合測試**：使用 `supertest` 測試完整的 route → controller → service 流程。
- 每個路由需要至少包含：成功路徑與失敗路徑（例如驗證失敗、資源不存在）。

```ts
// tests/users.test.ts 範例結構
describe("POST /api/users", () => {
  it("成功建立使用者，回傳 201", async () => { /* ... */ });
  it("email 重複時回傳 409", async () => { /* ... */ });
  it("缺少必填欄位時回傳 400", async () => { /* ... */ });
});
```

---

## Copilot Prompt 提示

| 任務 | 提示方式 |
|------|---------|
| 新增路由 | 「新增 `PATCH /trainings/:id` 路由，只更新 note 欄位」|
| 新增 controller | Copilot 會自動套用 `try/catch + next(err)` 模式 |
| 新增 service | Copilot 會避免操作 `res`，只回傳資料或拋 `HttpError` |
| 撰寫測試 | 「為 `trainingsController.update` 撰寫整合測試，包含成功與失敗案例」|
