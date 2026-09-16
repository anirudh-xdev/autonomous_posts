---
name: trend-discovery
description: Guide for discovering, clustering, deduplicating, and scoring emerging AI and technology trends from multi-source streaming and polling adapters.
---

# Trend Discovery Skill

## Purpose
Explains how to discover raw technology signals from 7 heterogeneous sources, clean and canonicalize URLs and titles, cluster related items using Jaccard word similarity, and score topics using the 5-factor scoring engine.

## When to Use
- When adding a new source adapter (e.g., ArXiv papers, YouTube technical transcripts, Discord communities).
- When tuning scoring weights or adjusting thresholds for topic clustering.
- When diagnosing why a specific story was rejected or ranked low.
- When running manual or on-demand trend discovery runs.

## 7 Integrated Sources
1. **Hacker News AI** (`HackerNewsSource`): Queries Firebase Official API (`/v0/topstories.json`) and filters stories against curated AI keywords.
2. **GitHub Trending AI** (`GitHubTrendingSource`): Queries GitHub search API for top trending repositories created or pushed in the last 7 days in AI, ML, Python, and TypeScript.
3. **Reddit AI Communities** (`RedditSource`): Fetches JSON endpoints from `r/LocalLLaMA`, `r/MachineLearning`, and `r/artificial`, prioritizing high-upvote discussion threads.
4. **Tech & AI Lab RSS Feeds** (`TechNewsRSSSource`): Parses official RSS feeds from OpenAI, Anthropic, DeepMind, TechCrunch AI, and Ars Technica.
5. **Live Web AI Search** (`WebSearchTrendSource`): Executes real-time web queries for recent breakthrough announcements and framework updates.
6. **Social & X Tech Signals** (`SocialSignalsSource`): Scans developer conversation velocity, trending hashtags (#LocalLLaMA, #OpenSourceAI), and GitHub release milestones.
7. **Top AI Engineer Profiles** (`EngineerProfilesSource`): Monitors public engineering releases, blogs, and insights from leading practitioners (Simon Willison, Andrej Karpathy, Swyx, Harrison Chase, Jim Fan).

## Clustering & Deduplication Pipeline
1. **Text Normalization** (`clustering/normalizer.ts`):
   - Strips tracking parameters (`utm_*`, `ref`, `source`, `fbclid`).
   - Removes boilerplate prefixes ("Show HN:", "Ask HN:", "[D]", "[R]").
   - Tokenizes and removes English stopwords.
2. **Jaccard Topic Clustering** (`clustering/clusterer.ts`):
   - Computes Jaccard word set intersection over union.
   - If `Jaccard(A, B) >= 0.35` OR common curated technical keywords overlap >= 2, items are merged into a single `ClusteredTopic`.
   - Highest-engagement candidate becomes the canonical title and primary URL.
   - All source references are preserved as `TrendEvidence` records.

## 5-Factor Scoring Formula
Each cluster is evaluated on a 0–100 scale:
$$ \text{Total Score} = 0.25 \times \text{Novelty} + 0.25 \times \text{Velocity} + 0.25 \times \text{Technical Depth} + 0.15 \times \text{Actionability} + 0.10 \times \text{Broad Relevance} $$

- **Novelty (25%)**: Age penalty (decay over 48 hours) + presence of new release markers.
- **Velocity (25%)**: Multi-source corroboration (multiple independent sources boost velocity score).
- **Technical Depth (25%)**: Presence of benchmarks, architecture terms, repo links, or paper citations.
- **Actionability (15%)**: Code snippets, pip/npm commands, deployable models, or developer workflows.
- **Broad Relevance (10%)**: Relevance to software engineers, full-stack builders, and enterprise architects.

A detailed human-readable `scoringRationale` is saved alongside the numeric scores.

## Important Files
- `src/packages/trend-engine/sources/`: All 7 source adapter implementations.
- `src/packages/trend-engine/clustering/normalizer.ts`: Normalization utilities.
- `src/packages/trend-engine/clustering/clusterer.ts`: Jaccard clustering logic.
- `src/packages/trend-engine/scoring/scorer.ts`: 5-factor scoring engine.
- `src/packages/trend-engine/trend-discovery.service.ts`: Master orchestrator.

## Usage Example
```typescript
import { TrendDiscoveryService } from '@/packages/trend-engine/trend-discovery.service';

const discoveryService = new TrendDiscoveryService();
const result = await discoveryService.runDiscovery();
console.log(`Discovered ${result.candidatesFound} raw items, saved ${result.trendsSaved} canonical trends.`);
```
