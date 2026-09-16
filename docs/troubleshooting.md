# Troubleshooting & FAQ

## Common Issues & Solutions

### 1. `pnpm install` fails on native build scripts
- **Symptom**: `pnpm` v12+ blocks build scripts for `@prisma/client`, `esbuild`, or `msgpackr-extract`.
- **Solution**: Run:
  ```bash
  pnpm approve-builds --all
  ```
  Ensure `pnpm-workspace.yaml` contains `onlyBuiltDependencies` for these packages.

### 2. "Implemented but awaiting credentials" in publishing or AI logs
- **Symptom**: Generated posts are not appearing on live LinkedIn or X accounts.
- **Cause**: The application falls back to `MockPublisher` or `MockLLMProvider` when live API credentials are missing from `.env`.
- **Solution**: Provide valid credentials in `.env`:
  - For AI: Set `AI_PROVIDER="gemini"` and provide `GEMINI_API_KEY` (or `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).
  - For LinkedIn: Set `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_AUTHOR_URN`.
  - For X: Set `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`.

### 3. "Daily publication limit reached (max 2/day)"
- **Symptom**: Attempting to publish fails with a rate limit error.
- **Cause**: `MAX_POSTS_PER_DAY` (default: 2) prevents publishing more than 2 posts in a 24-hour window to safeguard your social accounts.
- **Solution**: Adjust `MAX_POSTS_PER_DAY=5` in `.env` or delete test publication rows from your database:
  ```bash
  pnpm prisma studio
  ```

### 4. "Tweet exceeds 280 characters limit"
- **Symptom**: Quality Gate fails a draft with a platform validator error.
- **Cause**: An individual tweet in the generated X thread exceeded 280 characters.
- **Solution**: Edit the draft directly in the Next.js Review Dashboard (`/content/[id]`). The live character counter displays character counts with color-coded warnings.

### 5. In-Memory Queue vs Redis Queue
- **Question**: Do I need to install Redis to run the project locally?
- **Answer**: No. When `REDIS_URL` is empty in `.env`, the queue runs entirely in-memory using Node.js event timers. Redis is only required for distributed production deployments.

### 6. SQLite Database Locked Error
- **Symptom**: `PrismaClientKnownRequestError: database is locked`.
- **Cause**: Multiple processes writing concurrently to `dev.db`.
- **Solution**: The application uses WAL mode for SQLite and connection pooling via `src/packages/database/client.ts`. Ensure you don't run multiple database migration commands simultaneously. For heavy concurrent write loads, migrate to PostgreSQL.

### 7. How to run manual trend discovery on demand?
- **Via UI**: Click **Discover Trends** in the top navigation or on the `/trends` page.
- **Via API**: Send a POST request to `/api/trends` with `{}`.
