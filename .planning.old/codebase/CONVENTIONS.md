# Coding Conventions

**Analysis Date:** 2026-05-11

## General Guidelines

- **Consistency**: Maintain a consistent style across backend (Python) and frontend (TypeScript).
- **Security First**: All state-changing requests must include CSRF protection. Rate limiting and security headers are mandatory for production.
- **Performance**: Use background tasks (Celery/Redis) for heavy operations. Frontend should use optimized React patterns (Server Components, etc.).

## Backend Conventions (Python/FastAPI)

### 1. Code Style
- **PEP 8**: Follow standard Python style guidelines.
- **Formatting**: Use **Ruff** for linting and formatting (line length 88).
- **Naming**: `snake_case` for functions and variables, `PascalCase` for classes.

### 2. API Design
- **Routers**: Organize endpoints by feature in `app/routers/`.
- **Pydantic**: Use Pydantic models for request/response validation.
- **Dependency Injection**: Use `Depends` for common logic like auth and database sessions.

### 3. Error Handling
- **Global Handler**: Use the global exception handler in `main.py`.
- **DB Logging**: Errors should be logged to the `SystemErrorLog` table.
- **HTTP Exceptions**: Always use `fastapi.HTTPException` for client-facing errors.

### 4. Database
- **Migrations**: Always use **Alembic** for schema changes. Never run raw SQL in production scripts.
- **Models**: Centrally define ORM models in `app/models.py`.

## Frontend Conventions (Next.js/React)

### 1. Components
- **Functional Components**: Use arrow functions and functional components exclusively.
- **Atomic Design**: Use Shadcn/UI primitives in `src/components/ui/` and build features in `src/components/`.
- **Typing**: Strict TypeScript usage for all component props and state.

### 2. State Management
- **Hooks**: Use custom hooks for complex logic.
- **Context**: Use React Context sparingly for global state (Auth, Theme).

### 3. Styling
- **Tailwind CSS 4**: Use utility classes for styling. Avoid inline styles or CSS-in-JS.
- **Naming**: `PascalCase` for component files and directory names.

### 4. Fetching
- **Axios**: Primary HTTP client for API interactions.
- **API Routes**: Use Next.js API routes only when necessary (e.g., as proxies).

---

*Conventions analysis: 2026-05-11*
*Update when adopting new linting rules or significant architectural patterns*
