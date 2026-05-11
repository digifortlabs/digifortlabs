# Testing Practices

**Analysis Date:** 2026-05-11

## Overview

The project currently has a minimal testing footprint, primarily focused on specific backend service validation. Expanding test coverage is a recommended priority for future phases.

## Backend Testing (Python/FastAPI)

### 1. Framework
- **Pytest**: The primary testing framework.
- **Plugins**: `pytest-asyncio` for testing async endpoints and services.

### 2. Structure
- Tests are located in `backend/app/tests/`.
- **Existing Tests**:
    - `test_ocr_classification.py`: Validates OCR and document classification logic.

### 3. Strategy
- **Unit Tests**: Focus on service-level logic (e.g., `ai_service.py`, `cleanup_service.py`).
- **Integration Tests**: Test FastAPI endpoints using `httpx.AsyncClient`.
- **Database**: Use a separate SQLite database for testing or mock database sessions.

## Frontend Testing (Next.js/React)

### 1. Framework
- **Jest**: Primary test runner.
- **React Testing Library**: For component and integration testing.

### 2. Structure
- Tests should ideally follow the `.test.tsx` or `.spec.tsx` naming convention alongside the components they test.
- Configuration found in `jest.config.mjs` (assumed) and `package.json` scripts.

### 3. Strategy
- **Component Tests**: Verify UI rendering and user interactions using RTL.
- **E2E Tests**: Not currently implemented, but Playwright or Cypress is recommended for critical user flows (Login, Record Upload).

## CI/CD Integration

- **Scripts**: `npm test` for frontend and `pytest` for backend.
- **Quality Gates**: Recommended to run linting (`ruff`, `eslint`) and tests on every pull request.

---

*Testing analysis: 2026-05-11*
*Update when adding new testing tools or significant test suites*
