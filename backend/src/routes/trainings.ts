// src/routes/trainings.ts
// Training CRUD 路由
// authenticate middleware 確保只有登入使用者能存取

import { Router } from "express";
import {
  getTrainings,
  getTrainingMarkers,
  getTrainingsByDate,
  getTraining,
  createTraining,
  updateTraining,
  deleteTraining,
} from "../controllers/trainingsController";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import { createTrainingSchema, updateTrainingSchema } from "../models/training";

const router = Router();

// 所有 training 路由都需要先通過 JWT 驗證
router.use(authenticate);

router.get("/", getTrainings);
router.get("/markers", getTrainingMarkers);
router.get("/by-date", getTrainingsByDate);
router.get("/:id", getTraining);
router.post("/", validate(createTrainingSchema), createTraining);
router.patch("/:id", validate(updateTrainingSchema), updateTraining);
router.delete("/:id", deleteTraining);

export default router;
