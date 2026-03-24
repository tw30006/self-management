import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  // 讓 Jest 可以讀到 .env.test (測試用的資料庫)
  setupFiles: ["<rootDir>/tests/setup.ts"],
  // 使用獨立的 tsconfig，讓測試檔能存取 @types/jest
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
};

export default config;
