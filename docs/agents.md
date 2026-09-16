# Autonomous Agents, Personas & Prompt Engineering

## Overview
The application orchestrates specialized AI agents to autonomously handle the stages between raw signal ingestion and social publication. Every agent execution is audited in the `AgentRun` table and guided by version-controlled prompt templates in `prompts/`.

## Agent Roles

```
  ┌─────────────────────────────────────────────────────────────┐
  │ 1. Trend Discovery Coordinator                              │
  │    - Ingests 7 heterogeneous sources                        │
  │    - Clusters related stories via Jaccard text similarity   │
  │    - Applies 5-factor scoring model                         │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 2. Technical Research Agent                                 │
  │    - Fetches primary source URLs                            │
  │    - Sanitizes HTML content into clean readable text        │
  │    - Synthesizes key facts, implications & benchmarks       │
  │    - Enforces strict factual provenance & citation sources  │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 3. Content Generation Engine                                │
  │    - Adopts Technical Developer Voice Profile               │
  │    - Synthesizes LinkedIn posts (700-1500 chars)            │
  │    - Synthesizes X posts (<=280 chars) & threads            │
  │    - Generates 2-3 distinct editorial angles                │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 4. Quality Gate Agent                                       │
  │    - Validates platform syntax and character constraints    │
  │    - Scans for banned buzzwords and marketing hype          │
  │    - Checks Jaccard token overlap against past publications │
  │    - Verifies factual veracity against ResearchReport       │
  └─────────────────────────────────────────────────────────────┘
```

## Technical Voice Persona
The voice of the generated content is explicitly tuned for senior software engineers and technical practitioners:
- **Core Stance**: *"What does this actually mean for engineers building software today?"*
- **Tone**: Analytical, pragmatic, and authoritative. Avoid cheerleading or vendor PR spin.
- **Prohibited Clichés**: "game-changer", "unleash", "mind-blowing", "revolutionary", "supercharge", "paradigm shift", "skyrocket".
- **Structure**:
  - Lead with the technical breakthrough or architecture change.
  - Break down practical trade-offs (memory footprint, latency, infrastructure cost, license).
  - Provide actionable developer takeaways (frameworks, SDKs, benchmarks).
  - Conclude with a technical discussion prompt.

## Prompt Management Architecture
All prompts are decoupled from TypeScript code and managed as versioned JSON templates in `prompts/`:
- **`prompts/research.v1.json`**: System instructions and schema for research synthesis.
- **`prompts/linkedin.v1.json`**: Formatting, character constraints, and voice instructions for LinkedIn.
- **`prompts/x.v1.json`**: Rules for single tweets ($\le 280$ chars) and multi-tweet reply threads.
- **`prompts/quality.v1.json`**: Prompt rubric for factual accuracy checking against research dossiers.

## Multi-Provider AI Abstraction
All AI operations use the unified `LLMProvider` interface (`src/packages/ai/types.ts`):
```typescript
export interface LLMProvider {
  name: string;
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
  generateStructured<T>(prompt: string, schema: z.ZodType<T>, systemPrompt?: string): Promise<T>;
}
```
Available providers:
- **`GeminiProvider`**: Uses Google Generative AI SDK (`gemini-1.5-pro` or `gemini-1.5-flash`).
- **`AnthropicProvider`**: Uses Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`).
- **`OpenAIProvider`**: Uses GPT-4o (`gpt-4o`).
- **`MockLLMProvider`**: Deterministic offline provider for unit testing and local development without API keys.
