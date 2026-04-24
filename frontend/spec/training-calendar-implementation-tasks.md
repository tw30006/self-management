# Training Calendar Implementation Tasks (By File)

## 使用方式

1. 依照 Phase 順序執行，不要跳段。
2. 每完成一個區塊，先做手動驗收再進下一塊。
3. UI 與 API 請分離：先完成 UI 狀態，再替換資料來源。

## Phase 1: Foundation（套件與基礎接線）

### src/main.ts

- [x] 註冊 v-calendar plugin。
- [x] 引入 v-calendar 樣式。
- [ ] 確認 plugin 初始化順序不影響 pinia/router。

### package.json

- [x] 安裝 v-calendar。
- [x] 安裝 @popperjs/core。
- [ ] 確認 lockfile 與依賴版本一致。

### 驗收

- [ ] `npm run dev` 可啟動。
- [ ] `npm run build` 可通過。
- [ ] Home 頁可看到可操作月曆。

## Phase 2: UI Skeleton（不串 API）

### src/views/HomeView.vue

- [ ] 新增頁面狀態：
  - [ ] `selectedDate`
  - [ ] `currentMonth`
  - [ ] `markedDates`
  - [ ] `dailyTrainings`
  - [ ] `dailyStatus`
  - [ ] `errorMsg`
- [ ] 建立月曆區塊（上方）與當日清單區塊（下方或右側）。
- [ ] 綁定日期點選事件（先用 mock 資料驅動）。
- [ ] 處理月份切換事件（先更新 `currentMonth`，暫不打 API）。
- [ ] 完成 5 種狀態畫面：idle/loading/success/empty/error。

### src/components/SelectedDay.vue（若作為展示元件）

- [ ] 僅保留展示責任（props + emits）。
- [ ] 不直接呼叫 API。
- [ ] 支援 loading/empty/error 的顯示模式（或由 HomeView 控制渲染）。

### src/components/DeleteConfirmModal.vue

- [ ] 完成刪除確認互動 UI（先不實際送刪除請求）。
- [ ] 對外 emit confirm/cancel。

### src/style.css（或 HomeView scoped style）

- [ ] 調整月曆與清單的響應式排版。
- [ ] 手機版確保可操作與可閱讀。

### 驗收

- [ ] 不接 API 也能完整 demo：點日切狀態、看空狀態、看錯誤狀態。
- [ ] 各狀態切換邏輯穩定，互不污染。

## Phase 3: API Integration（替換資料來源）

### src/api/trainings.ts

- [ ] 新增 markers API 方法：`getTrainingMarkers(month)`。
- [ ] 新增 by-date API 方法：`getTrainingsByDate(date)`。
- [ ] 補齊刪除 API 方法（若尚未統一）並確保型別一致。

### src/types/api.ts

- [ ] 定義 markers response 型別。
- [ ] 定義 by-date response 型別。
- [ ] 確認 training card 需要欄位與後端回應對齊。

### src/views/HomeView.vue

- [ ] `onMounted` 時請求 markers（使用 `currentMonth`）。
- [ ] 日期點選時請求 by-date，更新 `dailyTrainings` 與 `dailyStatus`。
- [ ] 錯誤時寫入 `errorMsg` 並切 `dailyStatus = error`。
- [ ] 實作重試按鈕行為（重打最後一次失敗請求）。
- [ ] 刪除成功後執行雙刷新：
  - [ ] 重新抓當日 by-date
  - [ ] 重新抓當月 markers

### src/api/http.ts

- [ ] 確認錯誤訊息可被上層消費（status/code/message）。
- [ ] 確認 GET 請求 query 參數建構方式一致。

### 驗收

- [ ] markers 可正確標示有訓練日期。
- [ ] 點日期可得到 success 或 empty。
- [ ] API 錯誤可重試。
- [ ] 刪除後卡片與月曆標記同步更新。

## Phase 4: Stabilization（穩定性與邊界）

### src/views/HomeView.vue

- [ ] 避免請求競態：切月/切日過快時只採用最後一次回應。
- [ ] 區分 empty 與 error，不共用文案。
- [ ] 對日期字串做格式守衛（YYYY-MM / YYYY-MM-DD）。

### 驗收

- [ ] 快速切月份不會出現舊資料覆蓋。
- [ ] 快速點日期不會出現狀態閃爍錯亂。

## 最小測試清單（手動）

1. 首頁載入：先看到月曆。
2. 月份切換：標記可更新。
3. 點有資料日期：顯示卡片。
4. 點無資料日期：顯示空狀態。
5. 模擬 API 失敗：顯示錯誤並可重試。
6. 刪除一筆：當日清單與月標記都更新。
7. 手機版：可點選日期、可滾動、可刪除。

## 建議實作順序（半天為單位）

1. Day 1 AM：HomeView UI 骨架 + 狀態模型（mock）。
2. Day 1 PM：完成五種狀態與刪除互動 UI。
3. Day 2 AM：串 markers + by-date。
4. Day 2 PM：串 delete 與雙刷新，做穩定性修正。
