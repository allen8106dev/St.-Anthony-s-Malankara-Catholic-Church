# St. Anthony's Malankara Catholic Church Platform

A foundation for a public church website and a private administration platform. Phase 1 establishes architecture only; it does not include member management, payments, or final website design.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Motion, Axios, TanStack Query
- Backend: Python, FastAPI, SQLAlchemy, Pydantic, Alembic
- Database: PostgreSQL (including Supabase PostgreSQL compatibility)

## Setup

1. Copy `.env.example` to `.env` and supply local, non-production values.
2. Create a PostgreSQL database matching `DATABASE_URL`.
3. Frontend:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
4. Backend:
   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

The frontend is served at `http://localhost:5173`; the API health endpoint is `http://localhost:8000/api/v1/health`.

## Administrator bootstrap (Phase 5)

Administrator accounts are never publicly registered. After applying migrations, create the first account from `backend`:

```powershell
python -m app.cli create-super-admin --email admin@example.org --name "Church Administrator"
```

The command securely prompts for a 12-character minimum password and does not echo it. Set a strong `SECRET_KEY`, production-only `DATABASE_URL`, explicit `CORS_ORIGINS`, and `COOKIE_SECURE=true` before deployment.

## Migrations

From `backend`, with `DATABASE_URL` set:

```powershell
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Development Workflow

Add public or admin pages through `frontend/src/routes`; add API features under `backend/app/api/routes`, with schemas, services, and models separated by responsibility. Use migrations for all database-schema changes.
