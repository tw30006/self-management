// src/server.ts
// 應用程式進入點，只負責啟動 HTTP server
// app 的設定在 app.ts，測試只需要 import app

import app from "./app";

const PORT = parseInt(process.env.PORT ?? "3000", 10);

app.listen(PORT, () => {
  console.log(`[server] Running on http://localhost:${PORT}`);
  console.log(`[server] Environment: ${process.env.NODE_ENV ?? "development"}`);
});
