---
description: 前端規範（Vue 3 + TypeScript + Vite）
applyTo: "frontend/**"
---

# Frontend Rules

## 技術與風格

- 使用 Vue 3 + TypeScript。
- 優先使用 Composition API 組織邏輯。
- 變數與函式命名採用 camelCase。
- 元件命名採用 PascalCase。

## 前端開發原則

- API 呼叫集中在 `frontend/src/api/`，避免分散在 view/component 內。
- 共用狀態優先放在 `frontend/src/stores/`。
- 可重用邏輯優先抽到 `frontend/src/composables/`。
- 調整 UI 時需同時確認 desktop 與 mobile 顯示。

## 參考技能

- 詳細 Vue 前端知識建議放在 `.github/skills/frontend-vue3.md`（可逐步補齊）。
