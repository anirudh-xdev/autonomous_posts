---
name: content-generation
description: Guide for synthesizing platform-tailored LinkedIn posts and X posts/threads using technical voice profiles, platform constraints, and prompt management.
---

# Content Generation Skill

## Purpose
Explains how the Content Generation Engine converts verified research dossiers into high-signal, platform-specific posts for LinkedIn and X. Enforces technical developer personas, prevents generic marketing hype, and produces structured draft variants.

## When to Use
- When customizing voice persona parameters (tone, technical depth, formatting guidelines, banned clichés).
- When modifying platform constraints (LinkedIn 700-1500 chars, X single post <= 280 chars, X thread 3-7 tweets).
- When inspecting or testing multi-variant generation for side-by-side review.
- When creating new prompt versions under `prompts/`.

## Voice Profile Architecture
The system relies on an active `VoiceProfile` entity in the database (or default fallback):
- **Tone**: `ANALYTICAL`, `PRACTICAL`, `AUTHORITATIVE`, or `CONVERSATIONAL`.
- **Target Audience**: Senior software engineers, AI/ML engineers, technical founders, and infrastructure architects.
- **Key Question**: Every piece of content must clearly answer: *"What does this actually mean for developers building systems today?"*
- **Banned Buzzwords**: Words like "game-changer", "unleash", "revolutionary", "supercharge", "paradigm shift", "skyrocket" are strictly forbidden.
- **Formatting Guidelines**: Use concise paragraphs, bullet points for readability, avoid emoji walls (max 2-3 per post), and end with an engaging technical question.

## Platform Post Specifications

### 1. LinkedIn Post
- **Target Length**: 700–1500 characters.
- **Structure**:
  1. High-signal opening hook (no clickbait).
  2. Technical context and core architectural shift.
  3. Concrete engineering takeaways (bullet points).
  4. Real-world tradeoffs (latency, cost, complexity).
  5. Thoughtful prompt for discussion with fellow practitioners.
  6. 3-5 relevant technical hashtags (#MachineLearning #SoftwareEngineering #AI).

### 2. X (Twitter) Post & Thread
- **Single Post**: Strictly $\le$ 280 characters. Packed with technical punch, actionable takeaway, and link or reference.
- **Thread Format**: 3 to 7 tweets.
  - Tweet 1: Hook + core announcement / architectural breakthrough.
  - Tweet 2-4: Key technical details, benchmarks, how it works under the hood.
  - Tweet 5-6: Engineering tradeoffs, developer implications, or repo/demo link.
  - Tweet 7: Summary + open question for technical builders.
  - Every tweet in the thread is verified against the 280-character limit.

## Important Files
- `src/packages/content/voice.service.ts`: Manages default and custom voice profiles.
- `src/packages/content/content.service.ts`: Orchestrates LLM prompt execution and post validation.
- `src/packages/content/types.ts`: Output contracts (`LinkedInPostOutput`, `XPostOutput`).
- `prompts/linkedin.v1.json`: Prompt for LinkedIn post generation.
- `prompts/x.v1.json`: Prompt for X post & thread generation.

## Code Example
```typescript
import { ContentGenerationService } from '@/packages/content/content.service';

const contentService = new ContentGenerationService();
const draft = await contentService.generateContentForTrend(trendId);

console.log('LinkedIn post generated length:', draft.linkedinPost.length);
console.log('X post generated length:', draft.xPost.length);
console.log('X thread count:', draft.xThread.length);
```
