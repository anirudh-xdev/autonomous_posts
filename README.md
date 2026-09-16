# AI Trend Content Automation Agent 🚀

> A production-grade, autonomous personal AI content engine that discovers emerging AI/technology trends, researches them with rigorous evidence verification, generates high-signal posts for LinkedIn and X with a distinct technical developer voice, enforces multi-factor quality safety gates, and publishes via official platform APIs.

---

## 🌟 Highlights

- **Multi-Source Discovery (7 Adapters)**: Continuous polling and streaming from Hacker News, GitHub Trending, Reddit (`r/LocalLLaMA`, `r/MachineLearning`), Tech & AI Lab RSS feeds (OpenAI, Anthropic, DeepMind), Live Web Search, Developer Social Signals, and Top AI Engineer Profiles (Karpathy, Willison, Swyx, Harrison Chase, Jim Fan).
- **Canonical Clustering & 5-Factor Scoring**: Jaccard similarity clustering (threshold 0.35) and transparent 5-factor scoring (Novelty, Velocity, Technical Depth, Actionability, Broad Relevance) with human-readable rationales.
- **Deep Technical Research Agent**: Sanitizes web sources, synthesizes evidence, and extracts structured key facts, developer implications, tradeoffs, benchmarks, and direct quotes.
- **Platform-Tailored Content Generation**:
  - **LinkedIn Post**: 700–1,500 characters, technical context, engineering takeaways, trade-offs, and practitioner discussion prompts.
  - **X (Twitter) Post & Thread**: Single post $\le$ 280 characters, and 3–7 tweet threads with verified per-tweet character bounds.
  - **Technical Voice Persona**: Focused on *"What does this actually mean for developers building systems today?"* with strict prohibition of generic AI marketing buzzwords.
- **Automated Quality Gate**: Composite scoring evaluating platform character limits, anti-spam/buzzword detection, past publication duplicate avoidance (Jaccard $\ge 0.65$ check), and factual veracity against research reports.
- **Official API Integrations (Zero Scraping)**:
  - LinkedIn: Official REST API (`https://api.linkedin.com/rest/posts`) using 3-legged OAuth tokens.
  - X (Twitter): Official Twitter API v2 (`https://api.twitter.com/2/tweets`) supporting single tweets and connected reply threads.
  - Strict zero-browser-automation guarantee (no Playwright, Puppeteer, or Selenium for publishing).
- **Encrypted Security & Safety Controls**:
  - AES-256-GCM encryption for stored OAuth access tokens and credentials.
  - Sensitive topic exclusion filter (blocks political controversy, medical claims, financial advice).
  - Configurable daily publication rate limiter (max 2 posts/day default).
- **Dual-Mode Architecture**:
  - Zero-dependency local setup: SQLite database (`dev.db`) + in-memory task queue.
  - Production cloud deployment: PostgreSQL/Supabase + BullMQ Redis queue.
- **Next.js 14 Modern Control Dashboard**:
  - Beautiful dark-mode interface with live side-by-side post editor, quality breakdown scorecards, trend exploration, publication history, content calendar, and analytics.

---

## 🏗️ Architecture Overview

```
 [7 Source Adapters]
 ├── Hacker News Firebase API
 ├── GitHub Trending Search API
 ├── Reddit JSON Feeds
 ├── Tech & AI Lab RSS Feeds
 ├── Live Web AI Search
 ├── Social & X Tech Signals
 └── Top AI Engineer Profiles
         │
         ▼
 [Trend Discovery Engine] ────► URL Normalization & Jaccard Clustering
         │                ────► 5-Factor Transparent Scoring
         ▼
 [SQLite / PostgreSQL DB] ◄───► [Next.js 14 Admin Dashboard]
         │                              ▲
         ▼                              │ (Review & Side-by-Side Editor)
 [Research Agent]                       │
         │ (Web Fetch & Synthesis)      │
         ▼                              │
 [Content Generation Engine] ───────────┤
         │ (LinkedIn & X Posts)         │
         ▼                              │
 [Quality Gate Pipeline] ───────────────┘
         │ (Platform, Spam, Duplicate, Veracity)
         ▼
 [Publishing Coordinator]
         │ (Safety Filter & Daily Rate Limit Guard)
         ├──► LinkedIn Official REST API (/rest/posts)
         └──► X (Twitter) Official API v2 (/2/tweets)
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **Package Manager**: `pnpm` (`v9+` or `v12+`)

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/autonomus_posts.git
cd autonomus_posts

# Install dependencies
pnpm install
```

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```
For local zero-dependency testing, `.env.example` comes pre-configured with default SQLite database and in-memory queue fallback. To use live LLM APIs, add your key:
```env
AI_PROVIDER="gemini" # or "anthropic", "openai", "mock"
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Initialize & Seed Database
```bash
# Generate Prisma Client
pnpm prisma:generate

# Push schema to SQLite database (dev.db)
pnpm prisma db push

# Seed default trend topics, sources, voice profile, and system settings
pnpm db:seed
```

### 4. Run the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run the Standalone Background Worker (Optional)
In another terminal, start the dedicated background worker process:
```bash
pnpm worker
```

---

## 🧪 Testing & Verification

Run the comprehensive Vitest test suite covering all 9 core packages:
```bash
# Run all 26 unit & integration tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build production bundle to verify compilation
pnpm build
```

---

## 📁 Repository Structure

```
├── .agents/skills/          # 11 AI Agent Skills (Architecture, Research, Publishers, etc.)
├── docs/                    # 12 comprehensive engineering guides
├── prisma/
│   ├── schema.prisma        # Local SQLite schema
│   └── schema.postgres.prisma # Production PostgreSQL schema
├── prompts/                 # Versioned AI prompt templates (v1)
│   ├── research.v1.json
│   ├── linkedin.v1.json
│   ├── x.v1.json
│   └── quality.v1.json
├── src/
│   ├── app/                 # Next.js 14 App Router (Pages, UI, and REST API Routes)
│   ├── components/          # Reusable UI components (Sidebar, QualityScorecard, etc.)
│   ├── packages/            # Modular backend services
│   │   ├── config/          # Zod env schema, AES-256 crypto, structured logger
│   │   ├── database/        # Prisma client singleton, repositories, seeders
│   │   ├── ai/              # Multi-provider LLM abstraction (OpenAI, Anthropic, Gemini, Mock)
│   │   ├── trend-engine/    # 7 Source adapters, clustering, 5-factor scoring
│   │   ├── research/        # Evidence reader, synthesis agent, structured reports
│   │   ├── content/         # Voice profiles, LinkedIn & X post generators
│   │   ├── quality-gate/    # Platform limits, anti-spam, duplicate detection
│   │   ├── publishers/      # Official LinkedIn REST & Twitter API v2 publishers
│   │   └── queue/           # BullMQ Redis + in-memory fallback, cron scheduler
│   └── worker.ts            # Standalone worker daemon entry point
└── tests/                   # Vitest unit & integration test suites
```

---

## ⚙️ Environment Variables Summary

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Node environment (`development`, `test`, `production`) |
| `DATABASE_URL` | `file:./dev.db` | SQLite URL or PostgreSQL connection string |
| `REDIS_URL` | *(empty)* | Redis connection string for BullMQ (in-memory if empty) |
| `ENCRYPTION_SECRET` | *(seeded)* | 64-hex-char key for AES-256-GCM token encryption |
| `AI_PROVIDER` | `gemini` | Active LLM (`mock`, `gemini`, `anthropic`, `openai`) |
| `AUTONOMOUS_PUBLISHING_ENABLED` | `false` | Enable hands-free automated posting after quality pass |
| `MAX_POSTS_PER_DAY` | `2` | Maximum allowable publications per calendar day |
| `LINKEDIN_ACCESS_TOKEN` | *(empty)* | Official LinkedIn OAuth 2.0 Access Token |
| `X_API_KEY` / `X_ACCESS_TOKEN` | *(empty)* | Official Twitter API v2 Credentials |

---

## 📚 Complete Documentation

- [Architecture Design & Data Flows](docs/architecture.md)
- [Local Setup & Environment Guide](docs/setup.md)
- [Database Schema & Migrations](docs/database.md)
- [Autonomous Agents & Personas](docs/agents.md)
- [Trend Discovery & 5-Factor Scoring](docs/trend-discovery.md)
- [Content Generation & Voice Specs](docs/content-generation.md)
- [LinkedIn Official REST API Guide](docs/linkedin.md)
- [X (Twitter) Official API v2 Guide](docs/x.md)
- [Task Queue & Cron Scheduling](docs/scheduling.md)
- [Production Deployment (PostgreSQL, Docker, Vercel)](docs/deployment.md)
- [Security, Encryption & Safety Controls](docs/security.md)
- [Troubleshooting & FAQ](docs/troubleshooting.md)

---

## 📄 License
MIT License. Built for autonomous, high-signal technical engineering thought leadership.
