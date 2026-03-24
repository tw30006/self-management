# Copilot 指示：Node.js + Express RESTful API 規範

目的

- 提供團隊一致的 Node.js + Express RESTful API 撰寫風格、檔案結構、錯誤處理與安全性建議，讓 Copilot 在自動補完或產生程式碼時遵循相同準則。

使用範圍

- 適用於後端服務 (Express) 的路由、控制器、服務層、模型、驗證、錯誤處理、測試與部署設定。

專案目錄建議

- `src/`
  - `routes/`：只包含 route 定義與綁定（簡潔），例如 `users.ts`。
  - `controllers/`：處理 request/response 的函式（不直接存取 DB）。
  - `services/`：商業邏輯、資料存取抽象化（與 DB 或外部 API 互動）。
  - `models/`：資料 model 或型別定義（可放 TypeScript interface 或 ORM model）。
  - `middlewares/`：共用 middleware（驗證、錯誤攔截、日誌、速率限制）。
  - `utils/`：工具函式與共用 helper。

命名與路由原則（RESTful）

- 路由使用複數名詞：`/users`, `/tasks`。
- 每個資源使用標準 HTTP 動作：
  - `GET /resources`：取得列表（支援分頁、排序、篩選）。
  - `GET /resources/:id`：取得單一資源。
  - `POST /resources`：建立資源。
  - `PUT /resources/:id` 或 `PATCH /resources/:id`：更新資源（PUT=全替換，PATCH=部分更新）。
  - `DELETE /resources/:id`：刪除資源。

HTTP 狀態碼與回傳格式

- 一律回傳 JSON：{
  - `success`: boolean,
  - `data`: object | array | null,
  - `error`: { `code`?: string, `message`: string } | null
    }
- 建議狀態碼：
  - 200 OK（成功）
  - 201 Created（建立成功）
  - 204 No Content（成功但無回傳內容，例如 DELETE）
  - 400 Bad Request（驗證失敗）
  - 401 Unauthorized（未驗證）
  - 403 Forbidden（無權限）
  - 404 Not Found（資源不存在）
  - 409 Conflict（衝突，例如重複）
  - 422 Unprocessable Entity（語意驗證失敗）
  - 500 Internal Server Error（伺服器錯誤）

驗證與資料校驗

- 使用 schema 驗證（例如 `Joi`, `zod`, `class-validator`）。
- 在 `middlewares/` 中把驗證抽成可重用 middleware。
- 驗證失敗回傳 400 或 422，並說明哪個欄位失敗。

錯誤處理

- 中央錯誤處理 middleware：統一格式化錯誤回應與紀錄（stacktrace 只在非 production 顯示）。
- 自訂錯誤類型（例如 `HttpError`）攜帶 `status` 與 `code`，方便前端與 SRE 判讀。

日誌與監控

- 使用結構化日誌（例如 `pino`, `winston`），並輸出 JSON 以利 log aggregator。
- 記錄 request id、user id（如有）、路由、方法、狀態碼、耗時。

安全性建議

- 檢查並限制輸入內容（避免注入攻擊）。
- 使用 helmet 設定安全相關 header。
- 對需要驗證的路由採用 JWT 或 session，並實作 RBAC/ACL 如有需要。
- 對敏感資料（密碼）使用安全雜湊（例如 bcrypt 或 argon2）。
- 啟用 CORS 規則（僅允許信任來源）。

敏感資料與 Secrets 管理

- 不要在程式碼、範例或版本控制中硬編碼密鑰、token、密碼或任何敏感資料。
- 範例中請使用占位符或 `process.env`（或等效方式），並在註解中說明如何從環境變數讀取。
- 在本地開發可使用 `.env` 檔搭配 `dotenv`（但千萬不要將 `.env` 提交到 git）；在生產環境請使用受管的 secrets 管理器（例如 AWS Secrets Manager、HashiCorp Vault、GCP Secret Manager、或 GitHub Actions Secrets）。
- 日誌與錯誤訊息務必遮罩或省略敏感欄位（例如 mask token、信用卡號），避免將 secrets 寫入任何可搜尋的日誌系統。
- 使用最小權限原則（least privilege）為 token 與 API key 設定範圍與存取時效，並定期輪替（rotate）密鑰。
- 若要在示範中包含 token 範例，請用類似 `{{YOUR_API_TOKEN}}` 的占位符，並在 README 或註解中說明如何安全取得與設定。
- 在 CI/CD 或部署流程中，把 secrets 從環境或 secrets 管理器注入容器或執行環境，勿透過原始碼或公開配置檔傳遞。

效能與分頁

- 列表 API 必須支援分頁：`page`/`limit` 或 `cursor`。
- 回傳分頁 metadata（`total`, `page`, `limit`）或 `nextCursor`。

測試

- Controller 與 service 層分離，方便做單元測試。
- 為每個 route 撰寫整合測試（使用 supertest 等工具）。

範例：routes -> controller -> service

```ts
// src/routes/users.ts
import express from "express";
import { getUsers, createUser } from "../controllers/users";
const router = express.Router();
router.get("/", getUsers);
router.post("/", createUser);
export default router;

// src/controllers/users.ts
export const getUsers = async (req, res, next) => {
  try {
    const result = await userService.list(req.query);
    res.json({ success: true, data: result, error: null });
  } catch (err) {
    next(err);
  }
};

// src/services/userService.ts
export const list = async (query) => {
  // 分頁/篩選邏輯
  return await UserModel.find(/* ... */);
};
```

Copilot 使用提示（Prompt Hints）

- 產生 route 時：請輸出完整 router 檔案，並匯出 router。
- 產生 controller 時：維持 `try/catch` 並在 catch 呼叫 `next(err)`，不要直接回傳 500。
- 產生 service 時：避免直接操作 `res`，只回傳資料或拋錯。
- 產生測試時：包含成功與失敗路徑的測試案例。

附註

- 此文件為團隊協定的起點，可依專案需求延伸（例如加入 GraphQL、事件驅動、CQRS 等模式）。

---

最後更新：請依專案實際技術棧（TypeScript/JavaScript、使用的 ORM/驗證函式庫）微調範例細節。

我是前端工程師，後端不熟。
請幫我建立後端 API 時，順便解釋每個部分在做什麼，
讓我能理解而不只是複製貼上。

Always respond to my queries in Traditional Chinese.
請務必使用繁體中文回答我的問題。
