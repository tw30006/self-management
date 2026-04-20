// src/services/authService.ts
// Google OAuth service：建立授權 URL、交換 code、取得 profile、簽發 JWT

import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpError";

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  token_type?: string;
};

type GoogleProfileResponse = {
  sub?: string;
  email?: string;
  name?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new HttpError(500, `Missing required env: ${name}`, "CONFIG_ERROR");
  }
  return value;
}

export function buildGoogleOAuthUrl(state: string): string {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const callbackUrl = requireEnv("GOOGLE_CALLBACK_URL");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

export async function loginWithGoogleCode(code: string) {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
  const callbackUrl = requireEnv("GOOGLE_CALLBACK_URL");
  const jwtSecret = requireEnv("JWT_SECRET");

  const ownerSub = requireEnv("GOOGLE_OWNER_SUB");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new HttpError(
      401,
      "Google token exchange failed",
      "GOOGLE_TOKEN_EXCHANGE_FAILED",
    );
  }

  const tokenJson = (await tokenRes.json()) as GoogleTokenResponse;
  if (!tokenJson.access_token) {
    throw new HttpError(
      401,
      "Google token payload invalid",
      "GOOGLE_TOKEN_INVALID",
    );
  }

  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    },
  );

  if (!profileRes.ok) {
    throw new HttpError(
      401,
      "Google profile fetch failed",
      "GOOGLE_PROFILE_FETCH_FAILED",
    );
  }

  const profile = (await profileRes.json()) as GoogleProfileResponse;
  if (!profile.sub || !profile.email) {
    throw new HttpError(
      401,
      "Google profile payload invalid",
      "GOOGLE_PROFILE_INVALID",
    );
  }

  if (profile.sub !== ownerSub) {
    throw new HttpError(
      403,
      "You are not allowed to login",
      "AUTH_NOT_ALLOWED",
    );
  }

  const user = await prisma.user.upsert({
    where: { email: profile.email },
    update: {
      googleId: profile.sub,
      name: profile.name ?? null,
    },
    create: {
      email: profile.email,
      googleId: profile.sub,
      name: profile.name ?? null,
    },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "7d" });

  return { token, user };
}
