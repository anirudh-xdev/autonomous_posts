# Production Deployment Guide

## Overview
In production, the application is typically partitioned into two services:
1. **Next.js Web Service**: Serves the UI dashboard and REST API endpoints (Vercel, AWS ECS, or Node.js server).
2. **Background Worker Daemon**: Runs `pnpm worker` to execute queue jobs and cron schedules without hitting HTTP request timeouts (Railway, Render, Fly.io).

## Target Architecture

```
                    ┌───────────────────────────┐
                    │       User Browser        │
                    └─────────────┬─────────────┘
                                  │ HTTPS
                                  ▼
                    ┌───────────────────────────┐
                    │    Next.js Web Service    │
                    │  (Vercel / Node.js App)   │
                    └──────┬─────────────┬──────┘
                           │             │
              SQL Queries  │             │ Enqueue Jobs
                           ▼             ▼
  ┌──────────────────────────┐         ┌──────────────────────────┐
  │   PostgreSQL Database    │         │       Redis Server       │
  │   (Supabase / Neon)      │         │   (Upstash / Cloud)      │
  └──────────────────────────┘         └────────────┬─────────────┘
                           ▲                        │
                           │ SQL Updates            │ Dequeue Jobs
                           │                        ▼
                    ┌──────┴────────────────────┐
                    │ Background Worker Daemon  │
                    │ (Railway / Render / Fly)  │
                    └───────────────────────────┘
```

## Step 1: Provision Infrastructure
1. **PostgreSQL Database**: Create a database on [Supabase](https://supabase.com) or [Neon](https://neon.tech). Obtain your connection string.
2. **Redis Instance**: Create a Redis database on [Upstash](https://upstash.com) or Redis Cloud. Obtain your `REDIS_URL`.

## Step 2: Database Migration
Migrate your PostgreSQL database using the production schema:
```bash
# Set your production database URL
export DATABASE_URL="postgresql://user:password@db.supabase.co:5432/postgres?schema=public"

# Push schema to PostgreSQL
pnpm prisma db push --schema=prisma/schema.postgres.prisma

# Seed production topics, sources, and settings
pnpm db:seed
```

## Step 3: Configure Environment Variables
Set the following secrets on your hosting providers:
```env
NODE_ENV="production"
DATABASE_URL="postgresql://user:password@db.supabase.co:5432/postgres?schema=public"
REDIS_URL="rediss://default:token@your-redis-host:6379"
ENCRYPTION_SECRET="your-64-character-hex-secret"

# AI Provider
AI_PROVIDER="gemini"
GEMINI_API_KEY="AIzaSy..."

# Platform Publishing
LINKEDIN_CLIENT_ID="..."
LINKEDIN_CLIENT_SECRET="..."
LINKEDIN_ACCESS_TOKEN="..."
LINKEDIN_AUTHOR_URN="urn:li:person:..."

X_API_KEY="..."
X_API_SECRET="..."
X_ACCESS_TOKEN="..."
X_ACCESS_SECRET="..."

# Automation Settings
AUTONOMOUS_PUBLISHING_ENABLED="false"
MAX_POSTS_PER_DAY="2"
```

## Step 4: Docker Container Deployment
Use the included multi-stage Docker build for deploying the web app or worker:
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm prisma:generate
RUN pnpm build

# Web service entry
CMD ["pnpm", "start"]

# Worker daemon entry (for worker containers)
# CMD ["pnpm", "worker"]
```
