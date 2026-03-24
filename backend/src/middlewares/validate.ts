// src/middlewares/validate.ts
// 通用 Zod 驗證 middleware — 可套用在任何路由
// 用法：router.post('/', validate(mySchema), controller)
// 把驗證邏輯抽離 controller，讓 controller 只需要處理業務邏輯

import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // parse 失敗時會丟出 ZodError，被 errorHandler 攔截
    schema.parse(req.body);
    next();
  };
}
