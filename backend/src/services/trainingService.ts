// src/services/trainingService.ts
// Training CRUD 的所有資料庫操作集中在這裡
// Controller 只負責把 req 轉成呼叫這些 function 的參數

import { prisma } from "../db/prisma";
import { Prisma } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import type {
  CreateTrainingInput,
  TrainingsByDateQueryInput,
  TrainingMarkersQueryInput,
  UpdateTrainingInput,
} from "../models/training";

function parseMonthRange(month: string) {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    throw new HttpError(400, "month 格式需為 YYYY-MM", "INVALID_QUERY");
  }

  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0));

  return { start, end };
}

function parseDateRange(date: string) {
  const parsed = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "date 格式需為 YYYY-MM-DD", "INVALID_QUERY");
  }

  // 防止像 2026-02-30 被 Date 自動滾成 3 月 2 日
  if (parsed.toISOString().slice(0, 10) !== date) {
    throw new HttpError(400, "date 格式需為 YYYY-MM-DD", "INVALID_QUERY");
  }

  const start = parsed;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

// 取得該使用者的訓練列表（含分頁）
export async function listTrainings(
  userId: number,
  query: { page?: string; limit?: string },
) {
  const page = Math.max(1, parseInt(query.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10)));
  const skip = (page - 1) * limit;

  // 同時查資料與總數量（Promise.all 並行，減少等待時間）
  const [trainings, total] = await Promise.all([
    prisma.training.findMany({
      where: { userId },
      orderBy: { performedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.training.count({ where: { userId } }),
  ]);

  return {
    trainings,
    meta: { total, page, limit },
  };
}

export async function getTrainingMarkers(
  userId: number,
  query: TrainingMarkersQueryInput,
) {
  const { start, end } = parseMonthRange(query.month);

  const trainings = await prisma.training.findMany({
    where: {
      userId,
      performedAt: {
        gte: start,
        lt: end,
      },
    },
    select: {
      performedAt: true,
    },
    orderBy: {
      performedAt: "asc",
    },
  });

  const dates = Array.from(
    new Set(
      trainings.map((training) =>
        training.performedAt.toISOString().slice(0, 10),
      ),
    ),
  );

  return {
    month: query.month,
    dates,
  };
}

export async function getTrainingsByDate(
  userId: number,
  query: TrainingsByDateQueryInput,
) {
  const { start, end } = parseDateRange(query.date);

  const trainings = await prisma.training.findMany({
    where: {
      userId,
      performedAt: {
        gte: start,
        lt: end,
      },
    },
    orderBy: { performedAt: "desc" },
  });

  return {
    date: query.date,
    trainings,
  };
}

// 取得單一訓練紀錄（確認屬於該使用者）
export async function getTraining(userId: number, trainingId: number) {
  const training = await prisma.training.findFirst({
    where: { id: trainingId, userId },
  });

  if (!training) {
    throw new HttpError(404, "找不到此訓練紀錄", "TRAINING_NOT_FOUND");
  }

  return training;
}

// 建立訓練紀錄
export async function createTraining(
  userId: number,
  input: CreateTrainingInput,
) {
  const training = await prisma.training.create({
    data: {
      userId,
      performedAt: new Date(input.performed_at),
      actionName: input.action_name,
      sets: input.sets,
      reps: input.reps,
      weight: new Prisma.Decimal(String(input.weight)),
      heartRate: input.heart_rate,
      notes: input.notes,
    },
  });

  return training;
}

// 部分更新訓練紀錄（PATCH）
export async function updateTraining(
  userId: number,
  trainingId: number,
  input: UpdateTrainingInput,
) {
  // 建立要更新的 data 物件（只包含有提供的欄位）
  const data: any = {
    ...(input.performed_at !== undefined && {
      performedAt: new Date(input.performed_at),
    }),
    ...(input.action_name !== undefined && { actionName: input.action_name }),
    ...(input.sets !== undefined && { sets: input.sets }),
    ...(input.reps !== undefined && { reps: input.reps }),
    ...(input.weight !== undefined && {
      weight: new Prisma.Decimal(String(input.weight)),
    }),
    ...(input.heart_rate !== undefined && { heartRate: input.heart_rate }),
    ...(input.notes !== undefined && { notes: input.notes }),
  };

  // 使用 updateMany 在單一 SQL UPDATE 中同時檢查 id 與 userId（atomic）
  const result = await prisma.training.updateMany({
    where: { id: trainingId, userId },
    data,
  });

  // 如果沒有任何列被更新，表示不存在或不屬於該使用者
  if (result.count === 0) {
    throw new HttpError(404, "找不到此訓練紀錄", "TRAINING_NOT_FOUND");
  }

  // updateMany 不會回傳更新後的資料，若需要回傳則再查一次（屬於同一筆且剛剛已被更新）
  const training = await prisma.training.findUnique({
    where: { id: trainingId },
  });

  return training;
}

// 刪除訓練紀錄
export async function deleteTraining(userId: number, trainingId: number) {
  // 先確認存在且屬於該使用者
  await getTraining(userId, trainingId);

  await prisma.training.delete({ where: { id: trainingId } });
}
