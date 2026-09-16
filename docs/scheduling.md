# Task Queues, Background Workers & Cron Scheduling

## Overview
The application handles long-running jobs (trend discovery, web research, LLM generation, quality evaluation, and publishing) asynchronously through a task queue and scheduler.

## Dual-Mode Queue Architecture
The `QueueManager` dynamically adapts to your runtime environment:
- **Production Mode (Redis BullMQ)**:
  - Enabled when `REDIS_URL` is set (e.g. Upstash, Redis Cloud, local Redis).
  - Offers distributed job locking, automatic retry backoffs, dead-letter job archiving, and persistence across restarts.
- **Local Dev / Testing Mode (In-Memory Queue)**:
  - Enabled when `REDIS_URL` is empty.
  - Runs in-process on the Node.js event loop with identical async job dispatch signatures.
  - Completely zero-dependency; requires no external services to develop or run tests.

## Background Worker Process
While Next.js handles user requests and REST API calls, background processing can be offloaded to a standalone worker daemon:
```bash
# Start worker daemon
pnpm worker
```
The worker daemon initializes queue listeners, registers job handlers, boots recurring cron schedules, and handles graceful shutdowns on `SIGINT`/`SIGTERM`.

## Autonomous Pipeline Chaining
When a pipeline job finishes, it triggers the next stage:
1. `discover-trends`: Discovers raw candidates, clusters them, and saves canonical trends. If a trend has `score >= 70`, dispatches `research-trend`.
2. `research-trend`: Fetches sources, sanitizes HTML, and synthesizes `ResearchReport`. Upon completion, dispatches `generate-content`.
3. `generate-content`: Synthesizes LinkedIn posts and X threads with voice persona guidelines. Upon completion, dispatches `evaluate-quality`.
4. `evaluate-quality`: Runs platform character, anti-spam, duplicate, and factual veracity checks. If passed and `AUTONOMOUS_PUBLISHING_ENABLED=true`, dispatches `publish-post`.
5. `publish-post`: Validates sensitive topic filters, checks daily rate limits, and publishes to LinkedIn and X official APIs.

## Configurable Cron Schedules
The `SchedulerService` (`src/packages/queue/scheduler.ts`) registers recurring jobs:

| Job Name | Default Schedule | Cron Expression | Purpose |
|---|---|---|---|
| `discover-trends` | Every 4 hours | `0 */4 * * *` | Ingests all 7 sources and scores new topics |
| `research-pipeline` | Every 6 hours | `0 */6 * * *` | Dispatches research on top unresearched trends |
| `sync-analytics` | Once daily | `0 2 * * *` | Polls LinkedIn and X APIs for post engagement metrics |

Cron schedules are configured in `.env` or overridden dynamically via the Settings API.
