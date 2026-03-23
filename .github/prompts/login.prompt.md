# planLoginPrompt

TL;DR - 在 `frontend/src/views/` 新增 `Login.vue`（Composition API），使用 Tailwind CSS，並以 Google Identity Services (GSI) 實作單一按鈕的 Google 登入（前端驗證 email，限制只能給使用者自己登入）。

## Steps

1. 建立 `frontend/src/views/Login.vue`：使用 Composition API，版面以 Tailwind 實現，畫面只包含一個 Google 登入按鈕（符合 figma）。
2. 新增路由：在 `frontend/src/router/index.ts` 加入 `/login` 路由並指向 `Login.vue`。 (_depends on step 1_)
3. 新增 Auth store：建立 `frontend/src/stores/auth.ts`（Pinia），儲存使用者資訊、登入/登出、以及前端的登入限制邏輯。 (_parallel with step 2_)
4. Google Identity Services 設定：在專案加入 env 變數 `VITE_GOOGLE_CLIENT_ID`，在 `index.html` 或 `Login.vue` 動態載入 `https://accounts.google.com/gsi/client`，在 `onMounted` 初始化 GSI並 renderButton。 (_depends on step 1_)
5. 驗證流程：`handleCredentialResponse` 取得 `credential`（id_token），在前端解碼檢查 `email` 是否為允許的帳號（限定為你自己的 email）；若需更安全，可 POST `id_token` 到後端驗證 endpoint（非必要，視需求）。
6. 文件與 env 範例：新增或更新 `.env.example`（或 README）說明如何取得 `VITE_GOOGLE_CLIENT_ID` 與如何測試登入。 (_parallel with step 1-4_)

## Relevant files

- `frontend/src/views/Login.vue` — 新增檔案，實作 UI 與 GSI 初始化/回呼。
- `frontend/src/router/index.ts` — 新增 `/login` 路由。
- `frontend/src/stores/auth.ts` — Pinia store 儲存 user 與登入狀態。
- `frontend/src/api/http.ts` — 可重用的 axios 實例（若要把 id_token 傳給後端驗證）。
- `.github/prompts/login.prompt.md` — prompt 原始需求（已被此計畫覆寫為規格文件）。

## Verification

1. 啟動前端 (`npm run dev` 或等效命令)，開啟 `/login`，畫面上顯示與 figma 對應的單一 Google 按鈕。
2. 點擊按鈕後成功觸發 Google 登入流程，`handleCredentialResponse` 回傳 `credential`，前端能解析並得到 `email` 與 `name`。
3. 前端檢查 `email` 與允許清單比對（僅允許指定 email），成功後 `auth` store 有 user 資訊並將使用者導向首頁。
4. 若選擇要後端驗證，POST `id_token` 至後端並由後端確認 token，有對應的成功/失敗回應。

## Decisions / Assumptions

- 使用 GSI（Google Identity Services）作為預設實作，因為 prompt 強調「畫面只有一個按鈕」且需求偏向單人快速登入（只允許你自己）。
- 不在此階段設置完整後端或使用 Firebase，除非你要求更完整的使用者管理或更高安全度。
- Tailwind 已在專案中可用，UI 將以 Tailwind class 實作，並盡可能符合 figma 的配色與佈局。

## Further Considerations / Questions

1. 你要我直接以 GSI 實作並在 repo 中新增 `Login.vue` 嗎？
2. 想要把 id_token 送到後端驗證（需新增 backend endpoint）或僅在前端檢查 email 即可？
3. 要不要我幫你準備 `.env.example` 範本與簡短的 README 測試步驟？

目前還沒有後端API，後端需要再寫一個驗證 `id_token` 的 endpoint。(之後開發)
let do this step by step
