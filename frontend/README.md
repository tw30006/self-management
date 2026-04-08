# Frontend (Vue 3 + TypeScript + Vite)

## Google OAuth Login Flow (Backend Driven)

1. 設定環境變數（同層建立 `.env.local`）

```env
VITE_API_BASE_URL=http://localhost:8080
```

2. 啟動 backend（需可存取 `/auth/google`, `/auth/me`, `/auth/logout`）
3. 啟動前端：`npm run dev`
4. 開啟 `http://localhost:5173/login`，點擊「使用 Google 登入」
5. Google callback 完成後，前端會透過 `/auth/me` 同步登入狀態

注意事項：
- 前端 API 請求使用原生 `fetch`，並固定帶 `credentials: 'include'`。
- 若本機跨網域，請確認 backend `CORS_ORIGIN` 與 cookie 設定可用。

## Local Development

```bash
npm ci
npm run dev
```

## Docker Development

Run from repository root:

```bash
docker compose up --build frontend
```

Then open `http://localhost:5173`.

## Docker Production-like Build

Run from repository root:

```bash
docker compose --profile prod up --build frontend-prod
```

Then open `http://localhost:8080`.
