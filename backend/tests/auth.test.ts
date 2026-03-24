// tests/auth.test.ts
// Auth API 整合測試
// supertest 讓我們可以模擬 HTTP 請求，不需要實際啟動 server

import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/db/prisma";

// 測試前清除 user 資料（以測試 email 為條件，避免影響其他資料）
const TEST_EMAIL = "test.auth@example.com";

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.$disconnect();
});

describe("POST /auth/register", () => {
  it("成功建立使用者，回傳 201 與 user 資料", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: TEST_EMAIL, password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(TEST_EMAIL);
    // 確認不會回傳密碼 hash
    expect(res.body.data.password).toBeUndefined();
  });

  it("重複 email 回傳 409", async () => {
    // 先建立一個使用者
    await request(app)
      .post("/auth/register")
      .send({ email: TEST_EMAIL, password: "password123" });

    // 再次嘗試用同一 email 註冊
    const res = await request(app)
      .post("/auth/register")
      .send({ email: TEST_EMAIL, password: "another-password" });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("EMAIL_CONFLICT");
  });

  it("密碼少於 8 字元回傳 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: TEST_EMAIL, password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("email 格式錯誤回傳 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "not-an-email", password: "password123" });

    expect(res.status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    // 每次登入測試前先建立使用者
    await request(app)
      .post("/auth/register")
      .send({ email: TEST_EMAIL, password: "password123" });
  });

  it("正確帳密回傳 200 與 token", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: TEST_EMAIL, password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe("string");
  });

  it("錯誤密碼回傳 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: TEST_EMAIL, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("不存在的 email 回傳 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });

    expect(res.status).toBe(401);
  });
});
