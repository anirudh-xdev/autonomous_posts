---
name: architecture
description: Comprehensive guide to the system architecture, component boundaries, data flow pipelines, and technical design decisions of the AI Trend Content Automation Engine.
---

# Architecture Skill

## Purpose
Provides deep operational and architectural knowledge of the AI Trend Content Automation Engine. Guides developers and AI agents in navigating package boundaries, data lifecycles, provider contracts, and cross-cutting concerns (encryption, logging, error handling).

## When to Use
- When planning new features, adding subsystems, or modifying cross-package interfaces.
- When tracing end-to-end data flow from raw discovery to social publishing.
- When extending configuration schemas, database models, or queue topologies.
- When auditing security posture, encryption boundaries, or service isolation.

## System Architecture Diagram
```
  [Trend Sources]
  - Hacker News Firebase API
  - GitHub Trending (REST API)
  - Reddit JSON (r/LocalLLaMA, r/MachineLearning)
  - Tech & AI Lab RSS Feeds
  - Live Web Search (DuckDuckGo/Tavily/Perplexity)
  - Social & X Signals
  - Top AI Engineer Profiles (Karpathy, Willison, Swyx, etc.)
         |
         v
  [Trend Discovery & Clustering Engine]
  - URL Normalization & Stemming
  - Jaccard Similarity Clustering (0.35 threshold)
  - 5-Factor Scoring (Novelty, Velocity, Technical Depth, Actionability, Broad Relevance)
         |
         v
  [SQLite / PostgreSQL Database] <---> [Next.js 14 Dashboard]
         |                                  ^
         v                                  | (Review / Approval UI)
  [Research Agent]                          |
  - Evidence Fetching & HTML Sanitization   |
  - Structured Synthesis (Key facts, quotes)|
         |                                  |
         v                                  |
  [Content Generation Engine]               |
  - Technical Voice Persona                 |
  - LinkedIn Post (700-1500 chars)          |
  - X Post (<=280 chars) & Thread           |
         |                                  |
         v                                  |
  [Quality Gate Pipeline] ------------------+
  - Platform Character & Syntax Checks
  - Anti-Spam & Buzzword Penalty
  - Duplicate Jaccard Overlap (< 0.65)
  - Factual Veracity against Research
         |
         v (If Autonomous or Approved)
  [Publishing Coordinator]
  - Sensitive Topic Exclusion Check
  - Daily Rate Limit Guard (<= 2/day)
  - Official LinkedIn REST API (/rest/posts)
  - Official Twitter API v2 (/2/tweets)
```

## Component Boundaries & Packages
All business logic is isolated in `src/packages/` with strict dependency directions:
1. `src/packages/config/`: Zod-validated environment config, structured JSON logger with secret redaction, AES-256-GCM crypto utility, domain error hierarchy. No downstream dependencies.
2. `src/packages/database/`: Prisma client, migrations, repositories (`trend`, `content`, `agent-run`), and database seeder. Depends on `config`.
3. `src/packages/ai/`: Multi-provider abstraction (`OpenAI`, `Anthropic`, `Gemini`, `Mock`), provider factory, and prompt template manager (`prompts/*.json`). Depends on `config`.
4. `src/packages/trend-engine/`: 7 source adapters, text normalizer, Jaccard clusterer, 5-factor scoring engine, and discovery coordinator. Depends on `config`, `database`.
5. `src/packages/research/`: Evidence fetcher, web source reader, and research synthesis agent. Depends on `config`, `database`, `ai`.
6. `src/packages/content/`: Voice profile manager, platform post generators. Depends on `config`, `database`, `ai`.
7. `src/packages/quality-gate/`: Platform validator, anti-spam detector, publication duplicate detector, and composite scoring engine. Depends on `config`, `database`, `ai`.
8. `src/packages/publishers/`: LinkedIn API client, X API v2 client, mock publisher, sensitive topic filter, and publishing coordinator. Depends on `config`, `database`.
9. `src/packages/queue/`: BullMQ Redis queue manager with in-memory fallback, worker processors, and recurring scheduler. Coordinates all above packages.
10. `src/app/`: Next.js 14 App Router UI and API endpoints.

## Core Rules & Constraints
1. **Zero Browser Automation for Publishing**: Playwright/Selenium MUST NOT be used for LinkedIn or X interactions. Strictly use official authenticated endpoints.
2. **Encrypted Credentials**: All OAuth access tokens, refresh tokens, and client secrets stored in the database MUST be encrypted using AES-256-GCM via `encryptToken` from `src/packages/config/crypto.ts`.
3. **Graceful Fallbacks**: When third-party API keys are missing, the system MUST fallback cleanly to Mock providers/publishers without crashing, reporting `Implemented but awaiting credentials`.
4. **Dual Mode Queue**: Queue workers run in-memory by default when Redis is not configured, allowing complete zero-dependency local testing.
5. **Human Review by Default**: Autonomous publishing is disabled by default (`AUTONOMOUS_PUBLISHING_ENABLED=false`). Posts require approval via UI or API.

## Important Files
- `src/packages/config/env.ts`: Central schema validation.
- `src/packages/database/client.ts`: Prisma singleton preventing pool exhaustion.
- `src/worker.ts`: Dedicated standalone worker process for queue jobs.
- `prisma/schema.prisma`: SQLite schema for local development.
- `prisma/schema.postgres.prisma`: PostgreSQL schema for production.

## Failure Modes & Mitigations
- **Database Connection Failure**: Repositories throw typed `DatabaseError`. Next.js API returns HTTP 500 with sanitized JSON error message.
- **Provider Rate Limiting**: AI providers and trend sources implement retry loops and fallback to mock fixtures or cached responses during testing.
- **Queue Memory Growth**: In-memory queue limits active history to prevent memory leaks in dev mode.
