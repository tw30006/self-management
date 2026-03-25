---
applyTo: "backend/src/**/*.ts, backend/tests/**/*.ts"
---

# Node.js + Express 後端程式碼規則

這份檔案的規則會在 Copilot 處理 `backend/src/**/*.ts` 時自動套用。

## 語言與溝通

- 所有程式碼**註解請使用繁體中文**。
- 我是前端工程師，後端不熟。請在協助建立後端 API 時，同步以**註解與簡短說明解釋每個部分的用途**，讓我能理解而不只是複製貼上。
- 請務必**使用繁體中文**回答我的問題。

## TypeScript 型別規範

- 禁止使用 `any`，一律用 `interface` 或 `type` 明確定義型別。
- 範例：`interface User { id: number; name: string }` 而不是 `any`。

## 專案結構命名原則

| 目錄           | 責任                                      |
| -------------- | ----------------------------------------- |
| `routes/`      | 只做路由綁定，不含商業邏輯                |
| `controllers/` | 處理 req/res，呼叫 service，不直接存取 DB |
| `services/`    | 商業邏輯與資料存取，不操作 `res`          |
| `models/`      | TypeScript interface / ORM model 定義     |
| `middlewares/` | 共用 middleware（驗證、錯誤、日誌）       |
| `utils/`       | 工具函式與 helper                         |

## RESTful 路由命名

- 路由一律使用**複數名詞**：`/users`、`/trainings`。
- HTTP 動作對應：
  - `GET /resources` — 取得列表
  - `GET /resources/:id` — 取得單筆
  - `POST /resources` — 建立
  - `PUT /resources/:id` — 全量更新
  - `PATCH /resources/:id` — 部分更新
  - `DELETE /resources/:id` — 刪除

## HTTP 回應格式

所有 API 回應**一律回傳此 JSON 結構**：

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

失敗時：

```json
{
  "success": false,
  "data": null,
  "error": { "code": "VALIDATION_ERROR", "message": "欄位 email 格式錯誤" }
}
```

（HTTP 狀態碼規範已移至技能檔 backend/.github/skills/backend-nodejs.md）

## Controller 撰寫規則

- 必須用 `try/catch`，在 `catch` 呼叫 `next(err)`，**不要**直接回傳 500。
- 不要在 controller 裡直接操作資料庫。

```ts
// ✅ 正確寫法
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await userService.list(req.query);
    res.json({ success: true, data: result, error: null });
  } catch (err) {
    next(err); // 交給中央錯誤處理 middleware
  }
};
```

## Service 撰寫規則

- Service 層**只回傳資料或拋出錯誤**，不操作 `req` / `res`。
- 這樣設計使 service 可獨立做單元測試。

## 驗證規則

- 在 `middlewares/validate.ts` 中實作可重用的驗證 middleware（使用 zod 或 Joi）。
- 驗證失敗回傳 400 或 422，並在 `error.message` 說明哪個欄位失敗。

## 安全規則

- 禁止在程式碼中**硬編碼**任何密鑰、token 或密碼，一律使用 `process.env.XXX`。
- 敏感資料（密碼）使用 `bcrypt` 或 `argon2` 雜湊，不可明文儲存。
- 路由需驗證時，套用 JWT middleware (`middlewares/authenticate.ts`)。
