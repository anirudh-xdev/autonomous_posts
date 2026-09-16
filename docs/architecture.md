# System Architecture & Technical Design

## Overview
The AI Trend Content Automation Engine is designed as a modular, event-driven, production-grade system that autonomously bridges the gap between raw, noisy technical internet signals and high-signal, practitioner-focused content on LinkedIn and X.

## High-Level Pipeline Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │          Heterogeneous Sources (7)           │
                  │  - Hacker News Firebase                      │
                  │  - GitHub Trending Search                    │
                  │  - Reddit JSON (r/LocalLLaMA, ML)            │
                  │  - Tech & AI Lab RSS Feeds                   │
                  │  - Live Web AI Search                        │
                  │  - Social & X Tech Signals                   │
                  │  - Top AI Engineer Profiles                  │
                  └──────────────────────┬───────────────────────┘
                                         │ Raw Candidates
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │       Discovery & Clustering Engine          │
                  │  - Normalizer: Clean URL & Strip Stopwords   │
                  │  - Clusterer: Jaccard Word Similarity (0.35) │
                  │  - Scorer: 5-Factor Weighted Formula         │
                  └──────────────────────┬───────────────────────┘
                                         │ Canonical Trends
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │          Database & Task Queue Layer         │
                  │  - SQLite (Local) / PostgreSQL (Prod)        │
                  │  - In-Memory (Local) / BullMQ Redis (Prod)   │
                  └──────┬───────────────────────────────▲───────┘
                         │ Job: research-trend           │
                         ▼                               │
                  ┌──────────────────────────────┐       │
                  │        Research Agent        │       │
                  │  - Evidence Fetcher (HTTP)   │       │
                  │  - HTML Sanitizer & Reader   │       │
                  │  - LLM Synthesis (v1 Prompt) │       │
                  └──────────────┬───────────────┘       │
                                 │ Job: generate-content │
                                 ▼                       │
                  ┌──────────────────────────────┐       │
                  │   Content Generation Engine  │       │
                  │  - Voice Profile Service     │       │
                  │  - LinkedIn Generator        │       │
                  │  - X Post & Thread Generator │       │
                  └──────────────┬───────────────┘       │
                                 │ Job: evaluate-quality │
                                 ▼                       │
                  ┌──────────────────────────────┐       │
                  │     Quality Gate Pipeline    │       │
                  │  - Platform Character Bounds │       │
                  │  - Anti-Spam / Buzzwords     │       │
                  │  - Historical Duplicates     │       │
                  │  - Factual Veracity          │       │
                  └──────────────┬───────────────┘       │
                                 │ Status: APPROVED      │
                                 ▼                       │
                  ┌──────────────────────────────────────┴───────┐
                  │        Review Dashboard or Autonomous        │
                  │  - Next.js 14 App Router UI                  │
                  │  - Side-by-Side Review & Editing             │
                  └──────────────┬───────────────────────────────┘
                                 │ Job: publish-post
                                 ▼
                  ┌──────────────────────────────────────────────┐
                  │             Publishing Coordinator           │
                  │  - Safety & Sensitive Topic Exclusions       │
                  │  - Daily Limit Check (<= 2/day)              │
                  │  - LinkedIn REST API (/rest/posts)           │
                  │  - Twitter API v2 (/2/tweets)                │
                  └──────────────────────────────────────────────┘
```

## Package Boundaries & Isolation
To maintain strict separation of concerns, the codebase is partitioned into self-contained packages under `src/packages/`:

1. **`config` (`src/packages/config/`)**:
   - Zero internal dependencies.
   - Houses Zod-validated environment schema (`env.ts`), structured JSON logging (`logger.ts`), AES-256-GCM encryption utility (`crypto.ts`), and standard application errors (`errors.ts`).
2. **`database` (`src/packages/database/`)**:
   - Manages the Prisma client lifecycle, database connection pooling, data seeder (`seed.ts`), and encapsulated repositories (`trend.repository.ts`, `content.repository.ts`, `agent-run.repository.ts`).
3. **`ai` (`src/packages/ai/`)**:
   - Multi-provider abstraction (`LLMProvider`) with complete implementations for OpenAI, Anthropic, Gemini, and Mock.
   - Manages versioned prompt templates stored in root `prompts/*.json`.
4. **`trend-engine` (`src/packages/trend-engine/`)**:
   - Encapsulates source ingestion, URL and text normalization, Jaccard topic clustering, and the 5-factor scoring model.
5. **`research` (`src/packages/research/`)**:
   - Fetches and sanitizes source web pages, invokes LLM with research prompt templates, and yields typed, structured evidence dossiers.
6. **`content` (`src/packages/content/`)**:
   - Translates research dossiers into platform-tailored LinkedIn posts and X threads governed by active voice profiles.
7. **`quality-gate` (`src/packages/quality-gate/`)**:
   - Inspects drafts against 4 independent rules (platform bounds, spam/hype detection, historical publication duplication, factual grounding) and computes composite quality scorecards.
8. **`publishers` (`src/packages/publishers/`)**:
   - Contains official API integration clients for LinkedIn REST API and Twitter API v2, token encryption adapters, sensitive topic safety filters, and the multi-platform publishing coordinator.
9. **`queue` (`src/packages/queue/`)**:
   - Provides a dual-mode job dispatcher (BullMQ Redis with an in-memory event-loop fallback), worker processor pipeline chaining, and cron schedules.

## Key Design Principles
- **No Scraping for Publishing**: All posting is performed exclusively via official REST endpoints authenticated with valid OAuth tokens. No Playwright, Puppeteer, or Selenium scripts.
- **Graceful Degradation**: When third-party API credentials (LinkedIn, X, OpenAI) are unconfigured, services cleanly route to mock implementations marked `Implemented but awaiting credentials`.
- **Zero-Dependency Local Dev**: The entire system can be run, tested, and demonstrated out-of-the-box using SQLite and in-memory queues without installing Redis or Docker.
- **Auditability**: Every AI agent invocation and publication attempt records structured execution logs in `AgentRun` or `Publication` tables with millisecond execution durations and token metrics.
