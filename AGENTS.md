# Church Platform Development Rules

## General
- Inspect related code before changing it; do not rewrite working code unnecessarily.
- Keep changes scoped, modules focused, and functionality non-duplicative.
- Prefer existing abstractions and reusable components over parallel implementations.
- Do not install dependencies without a clear need, and never hardcode secrets.

## Frontend
- Use TypeScript and avoid `any` unless it is genuinely required.
- Keep UI primitives reusable, business logic out of presentation components, and API calls centralized.
- Preserve responsive behavior, accessibility, and the established design system.

## Backend
- Keep API handlers thin. Validate through Pydantic, persist through SQLAlchemy, and put business rules in services.
- Use Alembic migrations for schema changes; never manually alter a production database schema.

## Security
- Never expose secrets to the frontend or trust client-side authorization.
- Validate backend input and never expose private member or financial information through public APIs.
- Enforce future admin permissions server-side.

## AI Coding Behavior
- Inspect adjacent code before adding a feature and explain decisions that affect future architecture.
- Do not remove working behavior merely to simplify an implementation.
