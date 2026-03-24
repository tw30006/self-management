// prisma.config.js
// Prisma 7 的設定檔（JavaScript 版本，因為 Prisma CLI 無法直接解析 TypeScript）
// 連線 URL 由環境變數 DATABASE_URL 提供，請參考 .env.example
//
// 注意：migrate 指令執行前請確保已設定 DATABASE_URL
// 本機開發：在 .env 設定，Docker：透過 docker-compose.yml 注入

require("dotenv/config");
const { defineConfig } = require("prisma/config");

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrate: {
    async adapter() {
      const { PrismaPg } = require("@prisma/adapter-pg");
      return new PrismaPg({ connectionString: process.env.DATABASE_URL });
    },
  },
});
