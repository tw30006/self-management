# Instruction 結構說明

此專案使用「根目錄集中管理」：

- 共用規範：`00-global.rule.md`
- 前端規範：`10-frontend.rule.md`（`applyTo: frontend/**`）
- 後端規範：`20-backend.rule.md`（`applyTo: backend/src/**/*.ts, backend/tests/**/*.ts`）

## 原則

- 新增規範時，優先放在根目錄 `.github/instructions/`。
- 只有在「特定子專案必須獨立維護」時，才在子資料夾建立 `.github`。
- 若前後端規範不同，請各自維護在對應 `*.rule.md`，不要混在單一檔案。

## 命名規範

- 檔名格式：`<順序>-<領域>.rule.md`
- 建議順序：`00` 全域、`10` 前端、`20` 後端
- 範例：`00-global.rule.md`、`10-frontend.rule.md`、`20-backend.rule.md`
