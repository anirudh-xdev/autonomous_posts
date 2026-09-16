---
name: research
description: Guide for conducting deep technical research, extracting verified evidence, sanitizing web sources, and synthesizing structured research dossiers using the Research Agent.
---

# Research Agent Skill

## Purpose
Explains how the autonomous `ResearchAgent` gathers multi-source evidence, sanitizes web HTML, queries the AI provider with structured prompts (`prompts/research.v1.json`), and generates an immutable, citation-backed `ResearchReport` for a discovered trend.

## When to Use
- When debugging research synthesis or prompt hallucination checks.
- When expanding source extraction to support PDF papers or GitHub README files.
- When triggering on-demand research on a specific trend via API or UI.
- When inspecting structured outputs: key facts, developer implications, technical tradeoffs, and direct quotes.

## Research Pipeline Flow
```
Trend Record + Evidence Records
         |
         v
[Source Reader] -> Fetches HTTP body with 8s timeout
                -> Strips scripts, styles, SVG, nav, footer
                -> Converts HTML to clean plain text (max 6,000 chars)
         |
         v
[AI Provider]   -> Injects prompt template (prompts/research.v1.json)
                -> Synthesizes evidence against technical developer rubric
                -> Returns validated JSON conforming to ResearchOutputSchema
         |
         v
[Persistence]   -> Stores ResearchReport in DB linked to Trend
                -> Updates Trend status to 'RESEARCHED'
                -> Logs AgentRun with execution duration and token count
```

## Schema & Output Contract
The research agent guarantees output conforming to `ResearchOutputSchema` (Zod validated):
- `summary`: Concise executive synthesis (2-3 paragraphs) answering "What happened and why does it matter?".
- `keyFacts`: List of 3-7 verifiable factual claims with citation source index.
- `developerImplications`: Concrete impact on engineering teams, developer workflows, performance, or infra costs.
- `technicalTradeoffs`: Honest engineering evaluation (latency, accuracy, memory, license, vendor lock-in).
- `benchmarksOrMetrics`: Quantitative numbers (tokens/sec, MMLU score, parameter count, memory footprint).
- `verifiableQuotes`: Direct notable statements from release authors or maintainers.
- `recommendedAngles`: 2-3 angles for content generation (e.g. "Practical migration guide", "Architecture breakdown", "Hype vs reality").

## Important Files
- `src/packages/research/source-reader.ts`: Safe HTTP fetcher and HTML text extractor.
- `src/packages/research/research.agent.ts`: Core orchestrator.
- `src/packages/research/types.ts`: Zod schema and TypeScript interfaces.
- `prompts/research.v1.json`: Versioned system prompt and extraction guidelines.

## Safety & Accuracy Rules
1. **Fact Grounding**: The AI provider is explicitly instructed: "Only assert facts that are directly supported by the provided source texts. Do not extrapolate benchmarks that are not present in the sources."
2. **Deterministic Fallback**: If LLM API fails or is in test mode, `MockLLMProvider` produces a complete, realistic developer dossier to prevent blocking downstream pipelines.
3. **Run Audit**: Every research run creates an `AgentRun` entity with input payload, output summary, execution duration in milliseconds, and error state.

## Code Example
```typescript
import { ResearchAgent } from '@/packages/research/research.agent';

const agent = new ResearchAgent();
const report = await agent.conductResearch(trendId);
console.log('Research complete. Key facts extracted:', report.keyFacts.length);
```
