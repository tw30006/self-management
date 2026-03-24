// src/utils/httpError.ts
// 自訂錯誤類別，讓錯誤帶著 HTTP 狀態碼一起往上傳
// 好處：統一錯誤格式，不需要在每個 controller 都寫 res.status(400).json(...)

export class HttpError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "HttpError";
  }
}
