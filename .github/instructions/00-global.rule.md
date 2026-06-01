---
description: 全專案共用規範（前後端都會參考）
---

# Global Rules

## 語言與溝通

- 回覆與註解預設使用繁體中文。
- 優先給可直接執行的做法，避免只停留在概念。

## 程式碼變更原則

- 先最小可行修改，再逐步擴充。
- 不要一次重構過大範圍，避免影響前後端既有流程。
- 禁止硬編碼機密資訊（token、password、API key），一律使用環境變數。

## 文件與命名

- 規範檔統一放在 `.github/instructions/`，並以 `*.rules.md` 命名。
- 領域知識檔統一放在 `.github/skills/`。
- prompt 範本統一放在 `.github/prompts/`，檔名請加領域前綴（例如 `frontend-xxx.prompt.md`、`backend-xxx.prompt.md`）。
