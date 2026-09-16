---
name: deployment
description: Guide for deploying the AI Trend Content Automation Engine to production environments (Vercel, Docker, Supabase, Neon, AWS) with security hardening and monitoring.
---

# Production Deployment Skill

## Purpose
Explains how to package, configure, and deploy the application to production environments. Covers PostgreSQL migration, environment secrets management, background worker deployment (e.g. Railway, Render, Fly.io), and Next.js frontend hosting on Vercel.

## When to Use
- When provisioning production infrastructure (PostgreSQL database, Redis instance).
- When configuring production environment variables and OAuth credentials.
- When creating Docker containers or deploying the standalone background worker.
- When configuring SSL certificates, CORS, and webhooks for LinkedIn and X.

## Production Architecture
In production, the application splits into two processes:
1. **Next.js Web Service (Vercel / Node.js Server)**:
   - Hosts the App Router UI (`/dashboard`, `/trends`, `/content`, etc.).
   - Serves authenticated REST API routes (`/api/*`).
   - Handles OAuth callbacks from LinkedIn and X.
2. **Background Worker Service (Render / Railway / Fly.io / ECS)**:
   - Runs `pnpm worker` (`src/worker.ts`).
   - Connects to PostgreSQL and Redis.
   - Executes scheduled cron intervals and heavy LLM pipelines without hitting web request timeouts.

## Production Database Migration
Switch from SQLite to PostgreSQL:
```bash
# 1. Point DATABASE_URL to your PostgreSQL/Supabase instance
DATABASE_URL="postgresql://user:password@db.supabase.co:5432/postgres?schema=public"

# 2. Push PostgreSQL schema
pnpm prisma db push --schema=prisma/schema.postgres.prisma

# 3. Seed production defaults
pnpm db:seed
```

## Production Environment Checklist
Ensure the following production secrets are configured:
- `NODE_ENV=production`
- `DATABASE_URL`: PostgreSQL connection string.
- `REDIS_URL`: Redis connection string (e.g. `rediss://default:token@upstash.io:6379`).
- `ENCRYPTION_SECRET`: 64-hex-character string for AES-256-GCM token encryption.
- `AI_PROVIDER`: `gemini`, `anthropic`, or `openai`.
- `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`: Verified API key.
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_ACCESS_TOKEN`.
- `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`.
- `AUTONOMOUS_PUBLISHING_ENABLED`: Set to `true` only when fully tested and ready for hands-free publishing.

## Docker Deployment
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm prisma:generate
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
```

## Important Files
- `src/worker.ts`: Worker entry point.
- `prisma/schema.postgres.prisma`: Production PostgreSQL schema.
- `.env.example`: Full template of production environment variables.
