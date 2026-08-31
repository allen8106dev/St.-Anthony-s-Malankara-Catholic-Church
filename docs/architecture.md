# Architecture Overview

The project has two independently runnable applications:

- `frontend`: a React single-page application. `PublicLayout` and `AdminLayout` deliberately keep the future public site and protected administration experience distinct. Routes are declared centrally and API communication goes through `services/apiClient.ts`.
- `backend`: a FastAPI application exposing versioned endpoints under `/api/v1`. Route modules handle HTTP concerns; schemas validate data; services will own business rules; models own persistence.

Configuration is loaded from environment variables by `app.core.config`. SQLAlchemy sessions are provided through the `get_db` dependency. Alembic reads the same database setting for migrations. PostgreSQL is required outside lightweight import checks.

Authentication and domain modules are intentionally only scaffolded in Phase 1. Protected endpoints must use authorization dependencies once authentication is implemented.
