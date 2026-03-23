# Frontend (Vue 3 + TypeScript + Vite)

## Local Development

```bash
npm ci
npm run dev
```

## Docker Development

Run from repository root:

```bash
docker compose up --build frontend
```

Then open `http://localhost:5173`.

## Docker Production-like Build

Run from repository root:

```bash
docker compose --profile prod up --build frontend-prod
```

Then open `http://localhost:8080`.
