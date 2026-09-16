# Database Schema, Repositories & Migrations

## Overview
The persistence layer uses Prisma ORM with a dual-schema strategy:
1. **`prisma/schema.prisma`**: Optimized for SQLite (`dev.db`), enabling zero-setup local development, rapid automated testing, and developer onboarding without external database servers.
2. **`prisma/schema.postgres.prisma`**: Production-ready schema targeting PostgreSQL (e.g. Supabase, Neon, AWS RDS) featuring native JSON types, enums, and compound indexing.

## Entity Relationship Model

```
 ┌──────────────────────┐         1:N         ┌──────────────────────┐
 │        Trend         │ ─────────────────── │    TrendEvidence     │
 │ - id (UUID)          │                     │ - id (UUID)          │
 │ - title              │                     │ - trendId (FK)       │
 │ - score (0-100)      │                     │ - sourceName         │
 │ - scoringRationale   │                     │ - sourceUrl          │
 │ - status             │                     │ - engagementScore    │
 └──────────┬───────────┘                     └──────────────────────┘
            │
            │ 1:1
            ▼
 ┌──────────────────────┐         1:N         ┌──────────────────────┐
 │    ResearchReport    │       ┌──────────── │     ContentDraft     │
 │ - id (UUID)          │       │             │ - id (UUID)          │
 │ - trendId (FK)       │       │             │ - trendId (FK)       │
 │ - summary            │       │             │ - platform           │
 │ - keyFacts (JSON)    │       │             │ - body               │
 │ - implications (JSON)│       │             │ - qualityScore       │
 │ - citations (JSON)   │       │             │ - status             │
 └──────────────────────┘       │             └──────────┬───────────┘
                                │                        │
                                │ 1:N                    │ 1:N
                                ▼                        ▼
                     ┌────────────────────┐   ┌──────────────────────┐
                     │   ContentVariant   │   │     Publication      │
                     │ - id (UUID)        │   │ - id (UUID)          │
                     │ - contentDraftId   │   │ - contentDraftId     │
                     │ - variantIndex     │   │ - platform           │
                     │ - body             │   │ - remotePostId       │
                     │ - rationale        │   │ - postUrl            │
                     └────────────────────┘   │ - metrics (JSON)     │
                                              └──────────────────────┘
```

## Core Models

### 1. `Trend` & `TrendEvidence`
- Tracks canonical technical topics discovered by the trend engine.
- Every discovered topic stores its primary canonical URL, composite score (0–100), and a structured 5-factor scoring rationale.
- Related `TrendEvidence` records maintain the provenance of every individual signal across Hacker News, GitHub, Reddit, RSS, Web Search, Social, and Engineer Profiles.

### 2. `ResearchReport`
- Created by the `ResearchAgent` upon technical synthesis.
- Persists verified key facts, developer implications, technical tradeoffs, benchmarks, and direct quotes.

### 3. `ContentDraft` & `ContentVariant`
- Represents generated platform posts for LinkedIn or X.
- Tracks platform character length, review status (`DRAFT`, `APPROVED`, `REJECTED`, `PUBLISHED`), and the composite quality score breakdown.
- Multi-variant drafts allow side-by-side comparison in the review dashboard.

### 4. `Publication`
- Records external publication events via official LinkedIn and Twitter APIs.
- Stores the external remote ID (`urn:li:share:...` or tweet ID), live public URL, publication timestamp, and tracked engagement metrics.

### 5. `VoiceProfile` & `SystemSetting`
- Configures voice persona parameters (tone, developer focus, banned words) and platform credentials.
- OAuth tokens and sensitive credentials stored in `SystemSetting` are encrypted using AES-256-GCM.

### 6. `AgentRun`
- Immutable audit log recording every automated agent execution (discovery, research, content generation, quality evaluation, publishing).
- Records execution duration in milliseconds, token usage, and error stack traces if failed.

## Repository Layer
Direct database calls are isolated in `src/packages/database/repositories/`:
- **`TrendRepository`**: `findRecentTrends`, `findPendingResearch`, `upsertClusteredTrend`, `updateTrendStatus`.
- **`ContentRepository`**: `createDraftWithVariants`, `findPendingReview`, `updateQualityScore`, `recordPublication`.
- **`AgentRunRepository`**: `recordRunStart`, `recordRunSuccess`, `recordRunFailure`.

## Database Commands
```bash
# Push schema changes to SQLite
pnpm prisma db push

# Generate Prisma Client after schema edits
pnpm prisma:generate

# Run seeder
pnpm db:seed

# Inspect database via Prisma Studio
pnpm prisma studio
```
