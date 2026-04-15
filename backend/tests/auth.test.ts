/// <reference types="jest" />
// tests/auth.test.ts
import { jest } from "@jest/globals";
// Auth API 整合測試（Google OAuth）

import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/db/prisma";
import { OAUTH_STATE_COOKIE_NAME } from "../src/utils/authConstants";

const TEST_EMAIL = "test.auth@example.com";
const TEST_GOOGLE_ID = "google-sub-123";
const TEST_ME_EMAIL = "test.auth.me@example.com";

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

beforeAll(() => {
  (global as typeof globalThis & { fetch: typeof fetch }).fetch =
    fetchMock as unknown as typeof fetch;
});

beforeEach(async () => {
  fetchMock.mockReset();
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.user.deleteMany({ where: { email: TEST_ME_EMAIL } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.user.deleteMany({ where: { email: TEST_ME_EMAIL } });
  await prisma.$disconnect();
});

describe("GET /auth/google", () => {
  it("應導向 Google OAuth 同意頁", async () => {
    const res = await request(app).get("/auth/google");

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(res.headers.location).toContain("state=");
    expect(res.headers["set-cookie"]?.[0]).toContain(
      `${OAUTH_STATE_COOKIE_NAME}=`,
    );
  });
});

describe("GET /auth/google/callback", () => {
  async function getOAuthState() {
    const authRes = await request(app).get("/auth/google");
    const location = String(authRes.headers.location ?? "");
    const state = new URL(location).searchParams.get("state");
    const rawSetCookie = authRes.headers["set-cookie"];
    const cookies = Array.isArray(rawSetCookie)
      ? rawSetCookie
      : rawSetCookie
        ? [rawSetCookie]
        : [];
    const stateCookie = cookies.find((cookie) =>
      cookie.startsWith(`${OAUTH_STATE_COOKIE_NAME}=`),
    );

    return { state, stateCookie };
  }

  it("缺少 code 時回傳 400", async () => {
    const { state, stateCookie } = await getOAuthState();
    const res = await request(app).get("/auth/google/callback");
    const req = request(app).get(`/auth/google/callback?state=${state ?? ""}`);

    if (stateCookie) {
      req.set("Cookie", stateCookie);
    }

    const withStateRes = await req;

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(withStateRes.status).toBe(400);
    expect(withStateRes.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("state 不一致時回傳 400", async () => {
    const { stateCookie } = await getOAuthState();
    const req = request(app).get(
      "/auth/google/callback?code=good-code&state=bad-state",
    );

    if (stateCookie) {
      req.set("Cookie", stateCookie);
    }

    const res = await req;

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_OAUTH_STATE");
  });

  it("Google token 交換失敗時回傳 401", async () => {
    const { state, stateCookie } = await getOAuthState();
    fetchMock.mockResolvedValueOnce({ ok: false } as unknown as Response);

    const req = request(app).get(
      `/auth/google/callback?code=bad-code&state=${state ?? ""}`,
    );
    if (stateCookie) {
      req.set("Cookie", stateCookie);
    }

    const res = await req;

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("GOOGLE_TOKEN_EXCHANGE_FAILED");
  });

  it("callback 成功時回傳 JWT 與使用者資料", async () => {
    const { state, stateCookie } = await getOAuthState();
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";

    try {
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

      const req = request(app).get(
        `/auth/google/callback?code=good-code&state=${state ?? ""}`,
      );
      if (stateCookie) {
        req.set("Cookie", stateCookie);
      }

      const res = await req;

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.token).toBe("string");
      expect(res.body.data.user.email).toBe(TEST_EMAIL);

      const user = await prisma.user.findUnique({
        where: { email: TEST_EMAIL },
      });
      expect(user).not.toBeNull();
      expect(user?.googleId).toBe(TEST_GOOGLE_ID);
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });
});

describe("GET /auth/me", () => {
  it("支援舊版 token payload 的 id 欄位", async () => {
    const user = await prisma.user.create({
      data: {
        email: TEST_ME_EMAIL,
        googleId: "google-sub-me-legacy",
        name: "Legacy Token User",
      },
    });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET ?? "test-secret-key-for-jest",
      { expiresIn: "7d" },
    );

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(user.id);
  });

  it("token payload userId 非數字時回傳 401（非 500）", async () => {
    const token = jwt.sign(
      { userId: "not-a-number" },
      process.env.JWT_SECRET ?? "test-secret-key-for-jest",
      { expiresIn: "7d" },
    );

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_TOKEN");
  });
});
