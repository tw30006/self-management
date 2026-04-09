// src/utils/authConstants.ts
// Auth 相關可重用常數，避免 controller / 測試散落魔術字串

export const OAUTH_STATE_COOKIE_NAME = "oauth_state";
export const OAUTH_STATE_COOKIE_TTL_MS = 5 * 60 * 1000; // 5 minutes
