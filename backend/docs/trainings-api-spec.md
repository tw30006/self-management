# Backend Trainings API 規格書

## 1. 文件目的
本文件定義 Trainings 相關查詢 API 之回傳格式與契約，提供前後端串接、測試與驗收的共同依據。

## 2. 範圍
- `GET /trainings/markers`：查詢指定月份有訓練的日期清單
- `GET /trainings/by-date`：查詢指定日期的訓練列表

## 3. 共用規則
### 3.1 驗證與授權
- 兩支 API 都是受保護路由，需先通過 JWT 驗證（`authenticate` middleware）。
- Token 支援：
  - `Authorization: Bearer <token>`
  - 或 httpOnly cookie `token`

### 3.2 統一回傳格式
成功：

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

失敗：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤訊息"
  }
}
```

### 3.3 時間與時區規則
- 查詢範圍採 UTC 計算。
- 月份查詢：`[monthStart, nextMonthStart)`（含起點、不含終點）。
- 日期查詢：`[dayStart, nextDayStart)`（含起點、不含終點）。

## 4. API 契約
## 4.1 GET /trainings/markers
用途：回傳某月份有訓練資料的日期（去重後）。

- Method: `GET`
- Path: `/trainings/markers`
- Auth: required
- Query:
  - `month: string`（必填，格式 `YYYY-MM`）

### Success Response
- Status: `200 OK`

```json
{
  "success": true,
  "data": {
    "month": "2026-04",
    "dates": ["2026-04-01", "2026-04-07", "2026-04-23"]
  },
  "error": null
}
```

說明：
- `dates` 為該月有訓練紀錄的日期字串陣列。
- 同一天多筆訓練只會出現一次（已去重）。

### Error Response（常見）
- `400 VALIDATION_ERROR`：`month` 缺漏或格式錯誤（非 `YYYY-MM`）
- `401 UNAUTHORIZED`：未帶 token
- `401 INVALID_TOKEN`：token 無效或過期

錯誤範例：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "month: month 格式需為 YYYY-MM"
  }
}
```

## 4.2 GET /trainings/by-date
用途：回傳指定日期的訓練列表。

- Method: `GET`
- Path: `/trainings/by-date`
- Auth: required
- Query:
  - `date: string`（必填，格式 `YYYY-MM-DD`）

### Success Response
- Status: `200 OK`

```json
{
  "success": true,
  "data": {
    "date": "2026-04-23",
    "trainings": [
      {
        "id": 12,
        "userId": 1,
        "performedAt": "2026-04-23T10:00:00.000Z",
        "actionName": "深蹲",
        "sets": 3,
        "reps": 10,
        "weight": "60.50",
        "heartRate": 130,
        "notes": "感覺不錯",
        "createdAt": "2026-04-23T10:30:00.000Z",
        "updatedAt": "2026-04-23T10:30:00.000Z"
      }
    ]
  },
  "error": null
}
```

空資料範例（同樣為成功）：

```json
{
  "success": true,
  "data": {
    "date": "2026-04-30",
    "trainings": []
  },
  "error": null
}
```

### Error Response（常見）
- `400 VALIDATION_ERROR`：`date` 缺漏或格式錯誤（非 `YYYY-MM-DD`）
- `401 UNAUTHORIZED`：未帶 token
- `401 INVALID_TOKEN`：token 無效或過期

錯誤範例：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "date: date 格式需為 YYYY-MM-DD"
  }
}
```

## 5. 參考實作檔案
- `src/routes/trainings.ts`
- `src/controllers/trainingsController.ts`
- `src/services/trainingService.ts`
- `src/models/training.ts`
- `src/middlewares/authenticate.ts`
- `src/middlewares/errorHandler.ts`
- `tests/trainings.test.ts`
