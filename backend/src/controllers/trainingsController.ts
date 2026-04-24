// src/controllers/trainingsController.ts
// Training CRUD controller
// authenticate middleware 已確保 req.user 存在，所以這裡可以安全使用 req.user!

import { Request, Response, NextFunction } from "express";
import * as trainingService from "../services/trainingService";
import type {
  CreateTrainingInput,
  TrainingsByDateQueryInput,
  TrainingMarkersQueryInput,
  UpdateTrainingInput,
} from "../models/training";
import {
  trainingMarkersQuerySchema,
  trainingsByDateQuerySchema,
} from "../models/training";

function getSingleQueryValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return undefined;
}

// GET /trainings?page=1&limit=20
export async function getTrainings(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await trainingService.listTrainings(
      req.user!.userId,
      req.query as Record<string, string>,
    );
    res.json({ success: true, data: result, error: null });
  } catch (err) {
    next(err);
  }
}

// GET /trainings/markers?month=YYYY-MM
export async function getTrainingMarkers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = trainingMarkersQuerySchema.parse({
      month: getSingleQueryValue(req.query.month),
    }) as TrainingMarkersQueryInput;

    const result = await trainingService.getTrainingMarkers(
      req.user!.userId,
      query,
    );
    res.json({ success: true, data: result, error: null });
  } catch (err) {
    next(err);
  }
}

// GET /trainings/by-date?date=YYYY-MM-DD
export async function getTrainingsByDate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = trainingsByDateQuerySchema.parse({
      date: getSingleQueryValue(req.query.date),
    }) as TrainingsByDateQueryInput;

    const result = await trainingService.getTrainingsByDate(
      req.user!.userId,
      query,
    );
    res.json({ success: true, data: result, error: null });
  } catch (err) {
    next(err);
  }
}

// GET /trainings/:id
export async function getTraining(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const training = await trainingService.getTraining(
      req.user!.userId,
      parseInt(String(req.params.id), 10),
    );
    res.json({ success: true, data: training, error: null });
  } catch (err) {
    next(err);
  }
}

// POST /trainings
export async function createTraining(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const training = await trainingService.createTraining(
      req.user!.userId,
      req.body as CreateTrainingInput,
    );
    res.status(201).json({ success: true, data: training, error: null });
  } catch (err) {
    next(err);
  }
}

// PATCH /trainings/:id
export async function updateTraining(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const training = await trainingService.updateTraining(
      req.user!.userId,
      parseInt(String(req.params.id), 10),
      req.body as UpdateTrainingInput,
    );
    res.json({ success: true, data: training, error: null });
  } catch (err) {
    next(err);
  }
}

// DELETE /trainings/:id
export async function deleteTraining(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await trainingService.deleteTraining(
      req.user!.userId,
      parseInt(String(req.params.id), 10),
    );
    res.status(204).send(); // 204 No Content — 成功但不回傳內容
  } catch (err) {
    next(err);
  }
}
