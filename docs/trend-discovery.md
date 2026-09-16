# Trend Discovery, Clustering & 5-Factor Scoring

## Overview
The Trend Discovery Engine continuously monitors 7 heterogeneous sources across the internet, extracts emerging signals, canonicalizes and deduplicates them using Jaccard word similarity, and evaluates them using a transparent 5-factor scoring model.

## 7 Source Adapters

### 1. Hacker News AI (`HackerNewsSource`)
- Uses the official Firebase Hacker News API (`https://hacker-news.firebaseio.com/v0/topstories.json`).
- Inspects top and best stories, filtering titles and URLs for AI and systems keywords (`llm`, `quantization`, `inference`, `benchmark`, `transformer`, `agent`, `model`, `vllm`).

### 2. GitHub Trending AI (`GitHubTrendingSource`)
- Uses GitHub Search API (`https://api.github.com/search/repositories`).
- Queries repositories created or pushed within the past 7 days across topics `machine-learning`, `llm`, `deep-learning`, `ai-agent`, sorted by stars.

### 3. Reddit AI Communities (`RedditSource`)
- Polls official JSON endpoints for `r/LocalLLaMA`, `r/MachineLearning`, and `r/artificial`.
- Prioritizes top discussions with high engagement and technical commentary.

### 4. Tech & AI Lab RSS Feeds (`TechNewsRSSSource`)
- Parses official RSS/Atom feeds from:
  - OpenAI Research (`openai.com/news/rss.xml`)
  - Anthropic Research (`anthropic.com/feed.xml`)
  - Google DeepMind (`deepmind.google/blog/rss.xml`)
  - TechCrunch AI (`techcrunch.com/category/artificial-intelligence/feed`)
  - Ars Technica Tech (`arstechnica.com/feed`)

### 5. Live Web AI Search (`WebSearchTrendSource`)
- Executes live technical queries for new model releases, benchmark controversies, and framework launches.
- Gathers real-time corroboration for emerging rumors or early releases.

### 6. Developer Social Signals (`SocialSignalsSource`)
- Scans high-velocity developer conversations, trending hashtags (`#LocalLLaMA`, `#OpenSourceAI`), and GitHub release spikes.

### 7. Top AI Engineer Profiles (`EngineerProfilesSource`)
- Tracks engineering releases, blog posts, and technical notes from prominent AI practitioners:
  - Simon Willison (LLM tooling, Datasette, prompt injection research)
  - Andrej Karpathy (nanoGPT, LLM training mechanics, AI education)
  - Swyx / Shawn Wang (AI Engineering, smol-ai, Latent Space)
  - Harrison Chase (LangChain, LangGraph, agent architectures)
  - Jim Fan (Embodied AI, humanoid robotics, NVIDIA research)

## Clustering & Deduplication Pipeline
```
[Raw Signals from 7 Sources]
            │
            ▼
   URL & Title Normalizer
   - Strips tracking parameters (utm_*, ref, fbclid)
   - Removes boilerplate prefixes ("Show HN:", "[R]", "Ask HN:")
   - Tokenizes and removes common English stopwords
            │
            ▼
    Jaccard Similarity Clusterer
   - Word-set intersection over union Jaccard(A, B) >= 0.35
   - Or shared technical keyword overlap >= 2
            │
            ▼
[Canonical Clustered Topic]
   - Highest-engagement candidate becomes primary title & URL
   - Retains all source candidates as TrendEvidence records
```

## 5-Factor Scoring Model
Each canonical cluster is evaluated on a 0–100 scale:

| Factor | Weight | Evaluation Criteria |
|---|---|---|
| **Novelty** | 25% | Publication recency (decay curve over 48h) + release terms ("v0.2", "released", "open weights"). |
| **Velocity** | 25% | Multi-source corroboration (multiple independent sources boost velocity score). |
| **Technical Depth** | 25% | Presence of architectural concepts, benchmarks, GitHub repositories, or ArXiv papers. |
| **Actionability** | 15% | Deployability, installation commands, open weights availability, or code snippets. |
| **Broad Relevance** | 10% | Relevance across software engineering and developer infrastructure. |

### Scoring Formula
$$ \text{Score} = 0.25 \times \text{Novelty} + 0.25 \times \text{Velocity} + 0.25 \times \text{Technical Depth} + 0.15 \times \text{Actionability} + 0.10 \times \text{Broad Relevance} $$

A structured `scoringRationale` explaining the exact point allocation is stored with every trend for full transparency.
