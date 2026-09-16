---
name: queue
description: Guide for task queues, background workers, autonomous pipeline chaining, Redis BullMQ setup, in-memory fallbacks, and cron scheduling.
---

# Queue & Scheduler Skill

## Purpose
Explains how asynchronous jobs (trend discovery, deep research, content generation, quality verification, and social publishing) are queued, retried, and processed via BullMQ or the zero-dependency in-memory fallback.

## When to Use
- When debugging pipeline execution order or job concurrency.
- When configuring Redis credentials (`REDIS_URL`) for production vs running in-memory for development.
- When scheduling recurring cron jobs for discovery, research, and analytics sync.
- When inspecting or launching the standalone background worker process (`src/worker.ts`).

## Dual-Mode Queue Architecture
The `QueueManager` dynamically toggles between Redis and in-memory execution:
1. **BullMQ Redis Mode** (When `REDIS_URL` is set):
   - Backed by Redis connection.
   - Persistent job queues across application restarts.
   - Distributed locking, automatic backoff retries, and dead-letter handling.
2. **In-Memory Mode** (Default fallback when `REDIS_URL` is missing):
   - Completely zero-dependency. Runs inside Node.js event loop.
   - Perfect for local development and unit tests.
   - Same async dispatch and job handler interface.

## Autonomous Pipeline Chaining
When a job completes, the pipeline worker automatically triggers the next stage:
```
[discover-trends] -> Finds high-scoring trends (score >= 70)
        |
        v
[research-trend]  -> Synthesizes evidence and saves ResearchReport
        |
        v
[generate-content]-> Creates LinkedIn post and X thread drafts
        |
        v
[evaluate-quality]-> Runs platform, spam, and duplicate checks
        |
        v
(If passed & AUTONOMOUS_PUBLISHING_ENABLED)
[publish-post]    -> Posts to LinkedIn and X official APIs
```

## Scheduled Cron Jobs
The `SchedulerService` (`src/packages/queue/scheduler.ts`) registers standard cron jobs:
- `TREND_DISCOVERY_INTERVAL` (default: every 4 hours `0 */4 * * *`): Triggers `discover-trends`.
- `RESEARCH_PIPELINE_INTERVAL` (default: every 6 hours `0 */6 * * *`): Researches top unresearched trends.
- `ANALYTICS_SYNC_INTERVAL` (default: daily `0 2 * * *`): Syncs engagement metrics from published posts.

## Running Background Workers
In development, the queue runs inside the Next.js process or can be run as a standalone worker:
```bash
# Run standalone background worker
pnpm worker

# Run Next.js dev server
pnpm dev
```

## Important Files
- `src/packages/queue/queue.manager.ts`: Dual-mode queue dispatcher.
- `src/packages/queue/workers/pipeline.worker.ts`: Autonomous job chain handler.
- `src/packages/queue/scheduler.ts`: Cron schedule manager.
- `src/worker.ts`: Dedicated standalone worker entry point.
