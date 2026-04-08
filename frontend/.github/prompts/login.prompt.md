# Frontend Login Prompt (Backend OAuth + Fetch, Step by Step)

目標

- 前端改為串接後端既有 Google OAuth API。
- 只保留單一 Google 登入按鈕，不做註冊與密碼登入。
- 前端不再自行驗證 id_token，不再持有 Google credential。

TL;DR

- 在 frontend/src/views/Login.vue 建立 Login 頁面（Composition API + Tailwind）。
- 點擊登入按鈕後，導向後端 `GET /auth/google`。
- callback 後以前端 `fetch` 呼叫 `GET /auth/me` 同步使用者狀態。

## Phase 1: Login 畫面與路由

1. 建立 frontend/src/views/Login.vue。
2. Login 頁面只放一個 Google 登入按鈕區塊。
3. 在 frontend/src/router/index.ts 新增 /login 路由，指向 Login.vue。

完成條件

- 開啟 /login 可以看到登入頁面與按鈕。

## Phase 2: Auth Store 與狀態管理

1. 建立 frontend/src/stores/auth.ts（Pinia）。
2. Store 內容至少包含：

- user（id, email, name, createdAt）
- isAuthenticated
- hydrateSession()（呼叫 /auth/me）
- logout()

3. 以後端 cookie session + `/auth/me` 還原登入狀態。

完成條件

- callback 成功回前端後，store 可正確同步登入狀態；登出可清除狀態。

## Phase 3: Backend OAuth 流程整合

1. 登入按鈕觸發後導向 `${VITE_API_BASE_URL}/auth/google`。
2. 後端完成 OAuth callback 後設定 httpOnly cookie 並導回前端。
3. 前端路由守衛或 app 啟動時呼叫 `GET /auth/me` 還原使用者。
4. API 呼叫統一改用 `fetch`，並加上 `credentials: 'include'`。

完成條件

- 點擊按鈕可完成 Google OAuth 流程，前端可從 `/auth/me` 取得登入資訊。

## Phase 4: 會話與登出

1. 新增 `POST /auth/logout` 的前端呼叫。
2. 執行登出時清除前端 store 狀態。
3. `/login` 頁若已登入，應導回首頁。
4. 受保護頁面若未登入，應導向 `/login`。

完成條件

- 登入/未登入狀態切換正確，路由保護正常。

## Phase 5: 文件與環境設定

1. 更新 frontend/.env.example（或 README）加入 `VITE_API_BASE_URL`。
2. 補充本機測試步驟：

- 設定 env
- 啟動前端
- 開啟 /login 測試登入
- 完成 OAuth 後確認 `/auth/me` 可取得使用者

完成條件

- 新同事可依文件在本機完成 OAuth 登入測試。

## 下一階段（之後開發）

- 可加入 token 過期處理與自動重新導向。
- 可加入登入狀態初始化 loading UX。
- 可加入 `/auth/me` 失敗時的錯誤監控與追蹤。

## Relevant files

- frontend/src/views/Login.vue
- frontend/src/router/index.ts
- frontend/src/stores/auth.ts
- frontend/src/api/auth.ts
- frontend/src/api/http.ts
- frontend/.env.example

## 驗收清單

1. /login 有且只有 Google 登入按鈕。
2. 點擊按鈕可導向後端 `/auth/google`。
3. callback 後前端可透過 `/auth/me` 還原登入狀態。
4. 登入後 auth store 狀態正確，並可導頁。
5. 文件包含 `VITE_API_BASE_URL` 設定與測試步驟。
