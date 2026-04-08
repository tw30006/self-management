/// <reference types="jest" />
// tests/trainings.test.ts
// Training CRUD API 整合測試
// 每個測試案例都需要有效的 JWT token

import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/db/prisma";

const TEST_EMAIL = "test.training@example.com";
const TEST_GOOGLE_ID = "google-training-user";

let authToken: string;
let userId: number;

// 測試前：建立測試使用者並簽發 token
beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });

  const user = await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      googleId: TEST_GOOGLE_ID,
      name: "Training Tester",
    },
  });

  userId = user.id;
  authToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET ?? "test-secret-key-for-jest",
    { expiresIn: "7d" },
  );
});

// 測試後清除資料並斷線
afterAll(async () => {
  await prisma.training.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.$disconnect();
});

// 每次測試後清除 training 資料
afterEach(async () => {
  await prisma.training.deleteMany({ where: { userId } });
});

// 測試用的訓練資料
const sampleTraining = {
  performed_at: "2024-01-15T10:00:00.000Z",
  action_name: "深蹲",
  sets: 3,
  reps: 10,
  weight: 60.5,
  heart_rate: 130,
  notes: "感覺不錯",
};

describe("POST /trainings", () => {
  it("成功建立訓練紀錄，回傳 201", async () => {
    const res = await request(app)
      .post("/trainings")
      .set("Authorization", `Bearer ${authToken}`)
      .send(sampleTraining);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.actionName).toBe("深蹲");
    expect(res.body.data.sets).toBe(3);
  });

  it("未帶 token 回傳 401", async () => {
    const res = await request(app).post("/trainings").send(sampleTraining);
    expect(res.status).toBe(401);
  });

  it("缺少必填欄位回傳 400", async () => {
    const res = await request(app)
      .post("/trainings")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ action_name: "深蹲" }); // 缺少 sets, reps, weight, performed_at

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /trainings", () => {
  beforeEach(async () => {
    // 建立兩筆測試資料
    await request(app)
      .post("/trainings")
      .set("Authorization", `Bearer ${authToken}`)
      .send(sampleTraining);
    await request(app)
      .post("/trainings")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ ...sampleTraining, action_name: "硬舉", weight: 80 });
  });

  it("取得列表，回傳 meta 與陣列", async () => {
    const res = await request(app)
      .get("/trainings")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trainings).toHaveLength(2);
    expect(res.body.data.meta.total).toBe(2);
  });

  it("分頁：limit=1 只回傳 1 筆", async () => {
    const res = await request(app)
      .get("/trainings?page=1&limit=1")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.trainings).toHaveLength(1);
    expect(res.body.data.meta.limit).toBe(1);
  });
});

describe("GET /trainings/:id", () => {
  it("取得單一訓練紀錄", async () => {
    const createRes = await request(app)
      .post("/trainings")
      .set("Authorization", `Bearer ${authToken}`)
      .send(sampleTraining);
    const id = createRes.body.data.id;

    const res = await request(app)
      .get(`/trainings/${id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
  });

  it("不存在的 id 回傳 404", async () => {
    const res = await request(app)
      .get("/trainings/999999")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TRAINING_NOT_FOUND");
  });
});

describe("PATCH /trainings/:id", () => {
  it("部分更新成功", async () => {
    const createRes = await request(app)
      .post("/trainings")
      .set("Authorization", `Bearer ${authToken}`)
      .send(sampleTraining);
    const id = createRes.body.data.id;

    const res = await request(app)
      .patch(`/trainings/${id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ sets: 5, notes: "更新後的備注" });

    expect(res.status).toBe(200);
    expect(res.body.data.sets).toBe(5);
    expect(res.body.data.notes).toBe("更新後的備注");
  });
});

describe("DELETE /trainings/:id", () => {
  it("刪除成功回傳 204", async () => {
    const createRes = await request(app)
      .post("/trainings")
      .set("Authorization", `Bearer ${authToken}`)
      .send(sampleTraining);
    const id = createRes.body.data.id;

    const res = await request(app)
      .delete(`/trainings/${id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(204);

    // 確認已刪除
    const getRes = await request(app)
      .get(`/trainings/${id}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(getRes.status).toBe(404);
  });
});
