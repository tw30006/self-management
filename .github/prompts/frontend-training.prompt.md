# 新增訓練紀錄頁面規格書

## 1) 任務目標

- 建立「新增訓練紀錄」頁面。
- 依照後端 schema 建立表單欄位與前端驗證。
- 建立此頁面的前端路由。
- UI 需對齊附圖風格與指定色彩規範。

## 2) 參考資料

- 後端 schema 來源：`backend/src/models/training.ts` 的 `createTrainingSchema`。
- 視覺風格：使用者附圖（科技感深色面板、青色文字與按鈕）。

## 3) 欄位規格（對應 createTrainingSchema）

1. `performed_at`

- 類型：日期時間字串（ISO 8601）
- 表單建議：`datetime-local`
- 必填

2. `action_name`

- 類型：string
- 必填
- 規則：不可為空

3. `sets`

- 類型：number
- 必填
- 規則：正整數

4. `reps`

- 類型：number
- 必填
- 規則：正整數

5. `weight`

- 類型：number（可含小數）
- 必填
- 規則：必須為正數

6. `heart_rate`

- 類型：number
- 選填
- 規則：若有填寫，需為正整數

7. `notes`

- 類型：string
- 選填

## 4) 路由規格

- 新增路由：`/trainings/new`
- 路由對應頁面元件：`src/views/TrainingCreateView.vue`（若既有命名規範不同，沿用現有規範）
- 在導覽流程中可從首頁或訓練相關頁面進入。

## 5) 視覺與版面規格

### 全域風格

- 頁面背景：深色（依附圖風格）。
- 文字顏色：`#8FF5FF`
- 基本文字大小：`16px`

### 手機版

- 頁面左右 padding：`0 16px`

### 輸入框樣式

- 邊框色：`#45484F`
- 背景色：`#1C2028`
- 文字色：`#8FF5FF`
- placeholder 色：`#A9ABB3`

### 互動元件

- 送出按鈕需有明確可點擊狀態（預設 / hover / disabled）。
- 錯誤訊息使用可辨識顏色，並保留整體深色科技風格。

## 6) 驗證與錯誤處理

- 前端先做基本驗證，再呼叫 API。
- 驗證失敗：欄位下方顯示錯誤訊息。
- API 失敗：頁面顯示提交失敗訊息。
- 提交成功：提示成功並導向訓練列表或詳情頁（依現有流程）。

## 7) API 提交格式

- 提交 payload 欄位需與後端一致：
  - `performed_at`
  - `action_name`
  - `sets`
  - `reps`
  - `weight`
  - `heart_rate`（選填）
  - `notes`（選填）

## 8) 實作步驟（Step by step）

1. 建立頁面元件（例如：`src/views/TrainingCreateView.vue`）。
2. 建立表單欄位並套用指定樣式。
3. 實作前端欄位驗證規則（必填、正整數、正數、日期格式）。
4. 建立 API 呼叫方法並串接送出流程。
5. 在 `src/router/index.ts` 新增 `/trainings/new` 路由。
6. 建立提交成功與失敗的 UI 回饋。
7. 驗收手機版畫面（padding、字色、輸入框、placeholder）是否符合規範與附圖。

## 9) 驗收標準（Definition of Done）

- 可成功進入 `/trainings/new` 並顯示完整表單。
- 欄位與型別符合 `createTrainingSchema`。
- 驗證與錯誤提示正常運作。
- API 可成功送出並處理成功/失敗狀態。
- 手機版樣式符合：`padding: 0 16px`、文字色 `#8FF5FF`、輸入框邊框 `#45484F`、背景 `#1C2028`、placeholder `#A9ABB3`。
