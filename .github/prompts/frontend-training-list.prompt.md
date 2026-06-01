name: trainingList
description: 在 Home 頁實作訓練紀錄列表，採用科技感卡片風格並支援手機版
在 Home 頁面顯示訓練紀錄列表，資料由後端 GET trainings API 取得，並符合以下規格。

目標

顯示訓練紀錄清單，方便使用者快速查看最近訓練。
保持與首頁一致的深色科技風格，參考附圖資訊分層。
手機優先，確保小螢幕可讀且不破版。
資料來源

使用後端 API：GET /trainings?page=1&limit=20
需登入授權（Bearer token 或既有登入機制）
列表排序採最新優先（依 performedAt 由新到舊）
欄位需求

動作名稱：action_name 對應 actionName（必顯示）
組數：sets（必顯示）
次數：reps（必顯示）
重量：weight（必顯示，顯示單位 kg）
心率：heart_rate 對應 heartRate（有值才顯示）
備註：notes（有值才顯示）
UI/UX 規格

Home 結構：
標題區（如 TRAINING_LOG）
建立紀錄 CTA（導向 /trainings/new）
訓練卡片列表
分頁區（上一頁、下一頁、目前頁資訊）
卡片結構：
第一列：動作名稱（主標）與輔助識別資訊（可選）
第二列：時間資訊（performedAt 格式化）
第三列：SETS / REPS / WEIGHT 三欄數值
第四列：左側心率（可選）右側備註（可選）
視覺風格：
深色漸層背景 + 冷色高亮重點值
重要數值高對比，輔助文字低對比
卡片保留 hover/focus 狀態
狀態處理

Loading：顯示 skeleton cards
Error：顯示錯誤訊息與重試按鈕
Empty：顯示尚無資料提示與建立第一筆 CTA
Success：正常渲染卡片與分頁資訊
RWD 要求

Mobile（<768px）：單欄卡片，縮小間距與字級但維持可讀
Tablet（768px-1023px）：增加留白，維持資訊分層
Desktop（>=1024px）：卡片置中顯示，維持整體一致感
驗收標準

可正確顯示 actionName、sets、reps、weight
heartRate、notes 無值時不顯示空欄位
loading/error/empty/success 四種狀態可驗證
手機版不破版，資訊可讀
分頁切換可正確更新列表內容與頁碼資訊
實作提示

前端可新增 getTrainings API method（若目前僅有 createTraining）
建議在 Home 建立清楚的資料流與狀態管理（loading/error/data/meta）
本次先做列表顯示與分頁，編輯/刪除可列為後續擴充
