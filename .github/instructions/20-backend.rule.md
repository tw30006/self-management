---
description: 後端規範（Node.js + Express + TypeScript）
applyTo: "backend/src/**/*.ts, backend/tests/**/*.ts"
---

# Backend Rules

## 語言與教學風格

- 程式碼註解使用繁體中文。
- 建立 API 時，提供簡短用途說明，協助快速理解。

## TypeScript 規範

- 禁止使用 `any`，請使用 `interface` 或 `type`。

## 分層責任

- `routes/`：只做路由綁定，不含商業邏輯。
- `controllers/`：處理 req/res，呼叫 service，不直接存取 DB。
- `services/`：商業邏輯與資料存取，不操作 `res`。
- `middlewares/`：共用 middleware（驗證、錯誤處理、驗證授權）。

## API 與錯誤處理

- 回應格式統一：`{ success, data, error }`。
- Controller 使用 `try/catch`，在 `catch` 中呼叫 `next(err)`。
- 不在 controller 直接回傳通用 500，交由中央錯誤處理 middleware。

## 安全規範

- 禁止硬編碼密鑰、token、密碼，一律使用 `process.env`。
- 密碼需雜湊儲存（bcrypt 或 argon2）。

## 參考技能

- 詳細實作範例見 `.github/skills/backend-nodejs.md`。
