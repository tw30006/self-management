/// <reference types="jest" />
// tests/auth.test.ts
import { jest } from "@jest/globals";
// Auth API 整合測試（Google OAuth）

import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/db/prisma";

const TEST_EMAIL = "test.auth@example.com";
const TEST_GOOGLE_ID = "google-sub-123";

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

beforeAll(() => {
  (global as typeof globalThis & { fetch: typeof fetch }).fetch =
    fetchMock as unknown as typeof fetch;
});

beforeEach(async () => {
  fetchMock.mockReset();
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.$disconnect();
});

describe("GET /auth/google", () => {
  it("應導向 Google OAuth 同意頁", async () => {
    const res = await request(app).get("/auth/google");

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
  });
});

describe("GET /auth/google/callback", () => {
  it("缺少 code 時回傳 400", async () => {
    const res = await request(app).get("/auth/google/callback");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("Google token 交換失敗時回傳 401", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false } as unknown as Response);

    const res = await request(app).get("/auth/google/callback?code=bad-code");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("GOOGLE_TOKEN_EXCHANGE_FAILED");
  });

  it("callback 成功時回傳 JWT 與使用者資料", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "google-access-token" }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: TEST_GOOGLE_ID,
          email: TEST_EMAIL,
          name: "OAuth Tester",
        }),
      } as unknown as Response);

    const res = await request(app).get("/auth/google/callback?code=good-code");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.token).toBe("string");
    expect(res.body.data.user.email).toBe(TEST_EMAIL);

    const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    expect(user).not.toBeNull();
    expect(user?.googleId).toBe(TEST_GOOGLE_ID);
  });
});
