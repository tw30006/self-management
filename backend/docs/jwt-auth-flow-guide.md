# JWT 驗證完整流程說明（本專案版）

這份文件會用你目前 `backend` 專案的實作來解釋 JWT 是怎麼運作的。
重點是：
1. Token 在哪裡產生
2. Token 怎麼回到前端
3. 前端怎麼帶 token 呼叫 API
4. 後端怎麼驗證 token
5. 驗證成功後 controller 怎麼知道「你是誰」

---

## 1. 先理解角色分工

在你的專案中，Auth 主要由這幾個檔案負責：

- `src/routes/auth.ts`
  - 定義 `/auth/google`、`/auth/google/callback`、`/auth/me`、`/auth/logout` 路由
- `src/controllers/authController.ts`
  - 接收請求、呼叫 service、設定 cookie、回應前端
- `src/services/authService.ts`
  - 跟 Google 溝通、建立/更新使用者、簽發 JWT
- `src/middlewares/authenticate.ts`
  - 驗證 JWT，成功後把 `userId` 放進 `req.user`
- `src/routes/trainings.ts`
  - 用 `router.use(authenticate)` 保護所有 training API

---

## 2. JWT 是什麼（先有概念）

JWT（JSON Web Token）是一個「有簽名的字串」，通常由三段組成：

`header.payload.signature`

在這個專案中，payload 的核心資料是：

```json
{
  "userId": 123
}
```

後端用 `JWT_SECRET` 進行簽名。只要 token 內容被改過，簽名就會驗證失敗。

---

## 3. 登入階段（Token 產生）

### Step 1：前端打 `GET /auth/google`

- 對應：`authController.googleAuth()`
- 作用：
  1. 後端先產生隨機 `state`
  2. 以短效 `httpOnly cookie`（`oauth_state`）暫存
  3. 把 `state` 帶進 Google OAuth URL 後 `res.redirect(url)`

### Step 2：Google 轉回 `GET /auth/google/callback?code=...`

- 對應：`authController.googleAuthCallback()`
- 先用 Zod 驗證 query 的 `code`
- 再比對 `req.query.state` 與 `req.cookies.oauth_state`
- `state` 不一致會直接回 `400 INVALID_OAUTH_STATE`（防 CSRF）

### Step 3：用 code 跟 Google 換 access token + 取 profile

- 對應：`authService.loginWithGoogleCode(code)`
- 內部流程：
  1. `POST https://oauth2.googleapis.com/token`
  2. `GET https://www.googleapis.com/oauth2/v3/userinfo`

### Step 4：upsert 使用者

- 以 email 去 `users` 表 upsert（有就更新，沒有就建立）

### Step 5：簽發 JWT

在 `authService.ts` 目前是這樣做：

```ts
const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "7d" });
```

意思是：
- payload 放 `userId`
- 用 `JWT_SECRET` 簽名
- 有效期 7 天

---

## 4. Token 回到前端（你專案目前做法）

在 `googleAuthCallback`，你現在會：

1. `res.cookie("token", result.token, { httpOnly: true, ... })`
2. 非 test 環境下，`res.redirect(frontendUrl)`

也就是說，正式流程偏向「把 token 放在 httpOnly cookie」。

補充：
- `NODE_ENV === "test"` 時，會改回 JSON 回傳（方便測試）
- `httpOnly` 代表前端 JavaScript 不能直接讀 cookie，可降低 XSS 風險

---

## 5. 呼叫受保護 API（Token 驗證）

以 `/trainings` 為例，`src/routes/trainings.ts` 有這行：

```ts
router.use(authenticate);
```

代表 `/trainings` 底下所有路由都先經過驗證。

`authenticate.ts` 的實際流程是：

1. 先讀 `Authorization` header，格式要是 `Bearer <token>`
2. 若 header 沒有，再嘗試從 cookie 讀 `token`
3. 若兩者都沒有，回 401
4. 用 `jwt.verify(token, JWT_SECRET)` 驗證
5. 驗證成功：把 `payload.userId` 放到 `req.user`
6. 呼叫 `next()` 進 controller
7. 驗證失敗（無效/過期）：回 401

---

## 6. Controller 怎麼知道目前是誰

只要 middleware 驗證成功，controller 就可以透過 `req.user.userId` 取得登入者身分。

例如 `authController.getMe()`：

1. 取 `req.user?.userId`
2. 用這個 id 查資料庫
3. 回傳當前使用者資料

Trainings controller 也可用同樣方式做到：
- 只查自己的資料
- 只允許修改自己的資料

---

## 7. 請求範例（兩種傳 token 方式）

### A. 用 Authorization header

```bash
curl http://localhost:8080/trainings \
  -H "Authorization: Bearer <your_jwt>"
```

### B. 用 cookie（目前專案推薦）

前端請求要記得帶 credentials（例如 fetch）：

```ts
await fetch("http://localhost:8080/trainings", {
  method: "GET",
  credentials: "include",
});
```

後端 `cors` 也要 `credentials: true`（你的 `src/app.ts` 已設定）。

---

## 8. 401 常見原因（實務排錯）

1. 沒帶 token
2. Authorization 格式錯誤（不是 `Bearer <token>`）
3. JWT_SECRET 不一致（簽發和驗證使用了不同 secret）
4. token 過期
5. cookie 沒有被瀏覽器帶上（前端少了 `credentials: "include"`）
6. CORS origin / credentials 設定不匹配

## 8.1 OAuth state 失敗常見原因（400）

1. callback URL 沒帶 `state`
2. `oauth_state` cookie 遺失或過期（目前設 5 分鐘）
3. 同一瀏覽器開多個 OAuth 分頁，後回來的分頁覆蓋了前一個 state
4. callback 域名/port 與發起 OAuth 時不同，導致 cookie 沒被帶上

---

## 9. 本專案環境變數重點

`authService.ts` 需要以下 env 名稱：

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `JWT_SECRET`

目前 `authService.ts` 的 token 有效期是程式碼固定 `"7d"`。
若要可配置，建議新增 `JWT_EXPIRES_IN`（例如 `7d`、`1h`）並改成從 env 讀取。

---

## 10. 一句話總結整個 JWT 流程

登入成功後後端簽發 JWT，之後每次請求都帶著 token（header 或 cookie），後端用 `JWT_SECRET` 驗證並還原 `userId`，再把這個 `userId` 交給 controller 做權限與資料範圍控管。

---

## 11. 快速腦內流程圖（文字版）

1. 前端 -> `/auth/google`
2. 後端 -> redirect Google
3. Google -> `/auth/google/callback?code=...`
4. 後端 -> 換 token / 取 profile / upsert user
5. 後端 -> 簽發 JWT，設 cookie
6. 前端 -> `/trainings`（帶 token）
7. `authenticate` 驗證成功 -> `req.user.userId`
8. controller 根據 `userId` 回應資料
