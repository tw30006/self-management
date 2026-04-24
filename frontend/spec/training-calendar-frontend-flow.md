# Training Calendar Frontend Implementation Spec

## 文件目的

這份 spec 用來固定 Home 頁「先月曆、再當日訓練」的前端實作順序與驗收標準，避免在 UI 與 API 串接階段反覆重工。

## 搭配文件

若要直接進入執行，請搭配任務清單文件：

- `spec/training-calendar-implementation-tasks.md`（按 Phase 與檔案拆解）

## 開發策略總覽

1. 先安裝套件與完成基礎接線。
2. 先做 UI 與狀態流轉（使用假資料）。
3. 最後接 API，替換資料來源，不重寫 UI。

核心原則：

1. 月曆與卡片是兩個展示區塊，由 HomeView 協調資料流。
2. 展示元件不直接打 API。
3. 先穩定狀態模型，再接後端。

## Phase 1: 套件安裝與基礎接線

### 目標

能在 Home 頁看到可操作的月曆，且專案可正常編譯。

### 任務

1. 安裝套件：

```bash
npm install v-calendar@next @popperjs/core
```

2. 在 `src/main.ts` 註冊 v-calendar plugin。
3. 引入 v-calendar 樣式 `v-calendar/style.css`。
4. 確認 Vite 開發環境可正常啟動。

### 驗收

1. 月曆元件可顯示。
2. 月份切換可操作。
3. 手機與桌面不破版。
4. `npm run build` 可通過。

## Phase 2: UI 先行（不串 API）

### 目標

先完成完整互動流程與狀態切換，資料先以 mock 驗證。

### 狀態設計（固定命名）

1. `selectedDate`: 目前選定日期（YYYY-MM-DD）。
2. `currentMonth`: 月曆當前月份（YYYY-MM）。
3. `markedDates`: 當月有訓練的日期陣列。
4. `dailyTrainings`: 當日訓練資料。
5. `dailyStatus`: `idle | loading | success | empty | error`。
6. `errorMsg`: API 失敗訊息。

### UI 任務

1. Home 頁面先渲染月曆區塊。
2. 點日期後觸發當日列表區塊狀態切換。
3. 實作 5 種畫面狀態：
   - idle（初始提示）
   - loading（骨架或 spinner）
   - success（當日卡片）
   - empty（0 筆文案）
   - error（錯誤與重試按鈕）
4. 刪除按鈕先做互動外觀，先不打後端。

### 驗收

1. 不依賴 API 也可完整 demo：進頁、點日、看列表、看到空狀態與錯誤狀態。
2. 各狀態切換不互相污染。
3. 版面在手機與桌面都可操作。

## Phase 3: API 串接（由淺入深）

### 目標

保留既有 UI 結構，只替換資料來源與狀態更新邏輯。

### 串接順序

1. 串 `GET /trainings/markers?month=YYYY-MM`。
2. 串 `GET /trainings/by-date?date=YYYY-MM-DD`。
3. 串 `DELETE /trainings/:id` 並完成刪除後同步刷新。

### 實作細節

1. 進入 HomeView 時：
   - 以 `currentMonth` 先打 markers API。
   - 回填 `markedDates` 後渲染月曆標記。

2. 使用者點日期時：
   - 更新 `selectedDate`。
   - 設定 `dailyStatus = loading`。
   - 呼叫 by-date API，回填 `dailyTrainings`。
   - 依回傳筆數切到 `success` 或 `empty`。
   - 失敗時切到 `error` 並寫入 `errorMsg`。

3. 刪除訓練成功後：
   - 重新請求當日列表（by-date）。
   - 重新請求當月 markers。
   - 兩者都成功後再更新畫面，確保月曆標記與卡片一致。

### 驗收

1. 月曆可正確顯示有訓練日期。
2. 點任一日期可顯示當日資料或空狀態。
3. API 失敗可重試且畫面不崩潰。
4. 刪除後清單與月曆標記同步更新。

## 資料流與責任分界

### HomeView 的責任

1. 持有全部頁面狀態。
2. 管理 API 呼叫與錯誤處理。
3. 將資料透過 props 傳給展示元件。
4. 接收元件事件（例如日期點選、刪除確認）後再決定要呼叫哪個 API。

### 展示元件的責任

1. 只負責呈現。
2. 透過 emits 回傳使用者操作。
3. 不耦合後端格式。

## 風險與對策

1. 時區邊界問題：
   - 對策：前後端統一以本地日曆日或指定時區轉換規則，避免日期錯位。

2. 快速切月/切日造成舊請求覆蓋新狀態：
   - 對策：每次請求加上最新參數檢查，只接受最後一次有效回應。

3. 0 筆資料與請求失敗混淆：
   - 對策：`empty` 與 `error` 分開建模，不共用文案。

4. 刪除後只更新一塊畫面：
   - 對策：刪除成功後固定執行雙刷新（日列表 + 月標記）。

## 開發節奏建議

1. 一次只完成一個閉環（例如先 markers）。
2. 每完成一段立刻做手動驗收（成功/空/錯誤）。
3. 通過驗收再進下一段，避免跨段除錯。

## 最終驗收清單

1. 首頁預設先看到月曆。
2. 月曆有訓練日期可清楚標示。
3. 點日期可得到正確當日結果（有資料或 0 筆）。
4. API 錯誤可重試。
5. 刪除後月曆與列表一致。
6. 手機與桌面都能正常操作。
