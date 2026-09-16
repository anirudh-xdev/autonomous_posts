---
name: testing
description: Guide for running unit tests, integration tests, mocking strategies, test database isolation, and validating end-to-end pipelines with Vitest.
---

# Testing & Quality Verification Skill

## Purpose
Explains how to run, maintain, and write automated tests across all 9 packages using Vitest, manage test database isolation, and mock external API dependencies.

## When to Use
- When running the automated test suite before committing code or deploying.
- When creating unit tests for new source adapters, AI providers, or quality gate rules.
- When troubleshooting test timeouts or flaky network-dependent assertions.
- When testing database seed operations and repository mutations.

## Test Suite Structure
The test suite is organized under `tests/unit/` mirroring the core packages:
- `tests/unit/config.test.ts`: Zod environment validation, AES-256-GCM encryption/decryption, logger secret masking.
- `tests/unit/database.test.ts`: Prisma database connection, seeding, and repository CRUD operations.
- `tests/unit/ai.test.ts`: AI provider factory, Mock provider deterministic outputs, prompt template rendering.
- `tests/unit/trend-engine.test.ts`: Source adapters, URL normalizer, Jaccard clusterer, 5-factor scoring formula.
- `tests/unit/research.test.ts`: Source reader HTML sanitization, ResearchAgent execution, structured output schema.
- `tests/unit/content.test.ts`: Voice profile service, LinkedIn 700-1500 char bounds, X post <= 280 char bounds, thread validation.
- `tests/unit/quality-gate.test.ts`: Platform bounds check, anti-spam buzzword detector, duplicate Jaccard detector, composite score.
- `tests/unit/publishers.test.ts`: Sensitive topic filter, Mock publisher, daily post limit guard (<= 2/day).
- `tests/unit/queue.test.ts`: In-memory queue job dispatch, pipeline handler execution, scheduler lifecycle.

## Running Tests
```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run a specific test suite
pnpm test tests/unit/trend-engine.test.ts
```

## Testing Best Practices
1. **Network Isolation**: Unit tests should never make live external HTTP requests that can fail or time out. Source adapters detect `NODE_ENV === 'test'` and fast-track curated fixtures.
2. **Database Cleanliness**: Tests that create publications must purge their test records in `beforeAll` to avoid tripping daily rate limits (`MAX_POSTS_PER_DAY = 2`).
3. **Deterministic Mocking**: When testing AI-dependent modules, use `MockLLMProvider` or `MockPublisher` to ensure reproducible assertions.

## Important Files
- `vitest.config.ts`: Vitest test runner configuration and path aliases (`@/*`).
- `tests/unit/`: All unit test suites.
