// src/db/prisma.ts
// Prisma 7 的 Client 建立方式：使用 adapter 模式，不再依賴 schema.prisma 的 DATABASE_URL
// 連線字串從 process.env.DATABASE_URL 讀取

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// global 是 Node.js 的全域物件，開發環境下 ts-node-dev 會重載模組
// 但 globalThis 不會被清除，所以可以用來快取連線
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL 環境變數未設定，請參考 .env.example");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
