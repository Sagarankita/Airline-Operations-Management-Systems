# Modern Login Screen Design (AOMS)

Frontend + backend project for Airline Operations Management.

## Prerequisites

- Node.js `18+` (recommended: latest LTS)
- npm `9+`
- PostgreSQL running locally or remotely

## Project Structure

- Frontend (Vite + React): project root
- Backend (Express + PostgreSQL): `backend/`

## 1) Frontend Environment Setup

Create a root `.env` file:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

Notes:

- `VITE_API_URL` is used by `src/lib/api.ts`.
- If backend runs on a different host/port, update this value.

## 2) Backend Environment Setup

Create `backend/.env` with the required variables:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=airline_ops
DB_USER=postgres
DB_PASSWORD=postgres

# optional (defaults to http://localhost:5173)
CORS_ORIGIN=http://localhost:5173
```

Important:

- Backend startup fails if any of these are missing:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`

## 3) Install Dependencies

Frontend (root):

```bash
npm install
```

Backend:

```bash
cd backend
npm install
```

## 4) Initialize Database (Backend)

From `backend/`:

```bash
npm run setup
```

This runs:

- migrations (`npm run migrate`)
- seed data (`npm run seed`)

## 5) Run the Project

### Terminal 1 — Backend

From `backend/`:

```bash
npm run dev
```

Useful backend URLs:

- API docs: `http://localhost:3000/api-docs`
- Health: `http://localhost:3000/health`

### Terminal 2 — Frontend

From project root:

```bash
npm run dev
```

Default frontend URL:

- `http://localhost:5173`

## 6) Quick Troubleshooting

- Error: `Missing required environment variable: DB_HOST`
  - Fix: Ensure `backend/.env` exists and includes all required DB variables.

- Frontend loads but API calls fail
  - Verify backend is running on the same URL as `VITE_API_URL`.
  - Confirm CORS allows frontend origin (`CORS_ORIGIN`).

- DB connection fails
  - Check PostgreSQL is running.
  - Check credentials/database name in `backend/.env`.

## Common Commands

Frontend (root):

```bash
npm run dev
npm run build
```

Backend (`backend/`):

```bash
npm run dev
npm start
npm run migrate
npm run seed
npm run setup
```
