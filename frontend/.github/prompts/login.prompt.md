# Frontend Login Prompt (Google GSI, Step by Step)

目標

- 在前端先完成 Google 登入 UI 與基本驗證流程。
- 只保留單一 Google 登入按鈕，不做註冊與密碼登入。
- 目前先以前端驗證允許的 email；後續再串接後端 id_token 驗證 API。

TL;DR

- 在 frontend/src/views/Login.vue 建立 Login 頁面（Composition API + Tailwind）。
- 使用 Google Identity Services 載入並渲染登入按鈕。
- 取得 credential 後解碼 id_token，檢查 email 是否為允許帳號。

## Phase 1: Login 畫面與路由

1. 建立 frontend/src/views/Login.vue。
2. Login 頁面只放一個 Google 登入按鈕區塊。
3. 在 frontend/src/router/index.ts 新增 /login 路由，指向 Login.vue。

完成條件

- 開啟 /login 可以看到登入頁面與按鈕容器。

## Phase 2: Auth Store 與狀態管理

1. 建立 frontend/src/stores/auth.ts（Pinia）。
2. Store 內容至少包含：

- user（name, email, picture）
- isAuthenticated
- loginWithGoogleProfile(profile)
- logout()

3. 先以前端 local state 為主，暫不綁定後端 session。

完成條件

- 登入成功後可寫入 store，登出後可清除狀態。

## Phase 3: GSI 整合

1. 新增環境變數 VITE_GOOGLE_CLIENT_ID。
2. 在 Login.vue 動態載入 https://accounts.google.com/gsi/client。
3. 在 onMounted 初始化 google.accounts.id.initialize。
4. 使用 google.accounts.id.renderButton 渲染按鈕。
5. 實作 handleCredentialResponse，取得 credential（id_token）。

完成條件

- 點擊按鈕可觸發 Google 登入並回傳 credential。

## Phase 4: 前端帳號限制

1. 前端解碼 id_token payload（只作為暫時流程，不可視為最終安全機制）。
2. 檢查 email 是否在允許清單（例如僅你的帳號）。
3. 若不在允許清單，顯示錯誤訊息並不登入。
4. 若通過，寫入 auth store 並導向首頁。

完成條件

- 只有允許帳號可登入，其他帳號會被擋下。

## Phase 5: 文件與環境設定

1. 更新 frontend/.env.example（或 README）加入 VITE_GOOGLE_CLIENT_ID。
2. 補充本機測試步驟：

- 設定 env
- 啟動前端
- 開啟 /login 測試登入

完成條件

- 新同事可依文件在本機完成登入測試。

## 下一階段（之後開發）

- 後端新增 id_token 驗證 endpoint。
- 前端在拿到 credential 後 POST 給後端驗證。
- 由後端簽發自己的 JWT，前端只保存後端 token。

## Relevant files

- frontend/src/views/Login.vue
- frontend/src/router/index.ts
- frontend/src/stores/auth.ts
- frontend/src/api/http.ts
- frontend/.env.example

## 驗收清單

1. /login 有且只有 Google 登入按鈕。
2. Google 登入成功時可取得 credential。
3. 僅允許指定 email 登入。
4. 登入後 auth store 狀態正確，並可導頁。
5. 文件包含 VITE_GOOGLE_CLIENT_ID 設定與測試步驟。
