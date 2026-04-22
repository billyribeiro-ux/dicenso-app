# Testing Strategy

## Unit Tests (Vitest)
- Utilities, hooks, and pure functions
- Zod schema validation
- Date parsing logic
- Offline sync logic

## Component Tests (React Testing Library)
- Shared UI primitives
- Forms and validation
- Modal/drawer behavior
- Toast notifications

## Integration Tests
- Server Actions with test database
- Auth flows
- CRUD operations

## E2E Tests (Playwright)
- Critical user flows:
  - Sign up / sign in
  - Create note, edit, autosave
  - Create task, complete, filter
  - Command palette navigation
  - Search and open result
  - Timer start/pause/complete
- Cross-browser: Chromium, Firefox, WebKit
- Mobile viewport tests

## Accessibility Tests
- axe-core in CI
- Manual screen reader testing
- Keyboard navigation checklist

## Performance Tests
- Lighthouse CI
- Bundle size monitoring
- Editor load time benchmark

## Test Data
- `prisma/seed.ts` for development data
- `tests/fixtures/` for test fixtures
- Factory pattern for generating test entities
