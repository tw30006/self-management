---
name: docker
description: Docker 操作說明與執行規格書（供人員或 agent 使用）
---

<!-- Tip: Use /create-prompt in chat to generate content with agent assistance -->

## 目的

本檔提供可直接執行的 Docker 與 Docker Compose 指令集與驗收規格（執行規格書），讓任何拿到此檔的開發者或自動化 agent 能在本專案目錄下快速啟動、驗證並停止容器化的環境。

## 前置需求

- 已安裝 Docker 與 Docker Compose (v2)
- 在 Windows/WSL2 上請啟用 Docker Desktop 的 WSL 整合

## 包含檔案（專案中）

- [docker-compose.yml](../docker-compose.yml)
- [frontend/Dockerfile.dev](../frontend/Dockerfile.dev)
- [frontend/Dockerfile](../frontend/Dockerfile)
- [frontend/nginx.conf](../frontend/nginx.conf)

## 快速指令（在專案根目錄執行）

開發模式（Vite hot-reload，埠 5173）：

```bash
docker compose up --build frontend
```

正式靜態站（多階段建置後用 Nginx 提供，埠 8080）：

```bash
docker compose --profile prod up --build frontend-prod
```

停止並移除容器/網路：

```bash
docker compose down
```

查看日誌：

```bash
docker compose logs -f frontend
```

檢視已建置的映像：

```bash
docker images | grep frontend
```

## 執行規格書（驗收步驟）

1. 建置成功：執行 `docker compose up --build frontend` 或 `docker compose --profile prod up --build frontend-prod` 時，build 與 container 啟動過程無錯誤退出。
2. 開發模式驗收：瀏覽器開啟 http://localhost:5173 能看到應用，且 hot-reload 正常（修改檔案後頁面更新）。
3. 正式模式驗收：瀏覽器開啟 http://localhost:8080 能看到應用；若有 SPA route，刷新仍回到正確頁面（Nginx 已設 try_files）。
4. Health check（正式 image）：向 http://localhost:8080/health 應回傳 200 與字串 `ok`。
5. 日誌與清理：能用 `docker compose logs -f` 觀察日誌，並用 `docker compose down` 完整停止與移除。

## 常見問題與處理

- 如果收到 `docker: command not found`：確認 Docker 已安裝，或在 WSL2 上啟用 Docker Desktop 的整合。
- Windows 使用者若遇到檔案同步或權限問題，請檢查 WSL 路徑映射與 Docker Desktop 設定。
- 若 build 時 node module 過大或網路問題，先在本機執行 `npm ci` 驗證依賴是否可安裝，再用 `docker compose build --no-cache` 重新測試。

## 安全與注意事項（避免 prompt-injection 與資安風險）

- 不要在公共或未授權機器上把含有敏感環境變數的 `.env` 檔直接交付；如需 secrets，請使用 Docker secrets 或 CI/CD 的安全變數機制。
- 若 agent 會自動執行此檔中的 code block，請先審核 agent 權限並限定它只能執行必要的容器命令，避免任意 shell 執行或上傳敏感資料。

## 給 Agent 的建議

- Agent 可直接解析本檔並執行上方程式區塊（shell commands），但執行前請先確認宿主環境是否有 Docker 可用：

```bash
docker --version && docker compose version
```

- 若要自動化驗收，請依「執行規格書」步驟執行並檢查 HTTP 回應 & container 狀態（`docker compose ps` & `curl`）。

## 聯絡/回報

如遇無法解決的問題，請附上 `docker compose logs` 與 `docker compose ps` 的輸出，並描述主機作業系統與 Docker 版本，提交到專案 issue。

---

此檔為可執行的操作說明與驗收規格書，目的在於讓拿到此檔的開發者或 agent 能以最少指令直接啟動與驗證容器環境。
