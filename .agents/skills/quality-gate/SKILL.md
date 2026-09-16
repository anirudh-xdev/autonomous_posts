---
name: quality-gate
description: Guide for running comprehensive quality, spam, duplicate, and factual veracity verification on generated content before publishing.
---

# Quality Gate Skill

## Purpose
Explains how the multi-rule Quality Gate inspects generated content to prevent low-quality outputs, AI buzzword spam, platform character violations, duplicate publications, and factual hallucinations.

## When to Use
- When auditing why a post failed quality checks.
- When adjusting scoring weights, threshold scores, or duplicate Jaccard thresholds.
- When expanding the list of prohibited buzzwords or sensitive topic terms.
- When building automated CI or regression checks for content generation.

## Rule Breakdown & Composite Scoring
The Quality Gate computes a composite score (0–100) based on 4 independent inspection rules:

### 1. Platform Validator (`rules/platform-validator.ts`)
- **Weight**: 25% of composite score.
- **LinkedIn Checks**: Ensures character length is within bounds (target: 700–1500 chars).
- **X Checks**: Strictly verifies that single posts and every tweet in a thread does not exceed 280 characters.
- **Fail Condition**: Any tweet > 280 chars results in an immediate platform check failure.

### 2. Anti-Spam & Buzzword Detector (`rules/spam-detector.ts`)
- **Weight**: 25% of composite score.
- **Checks**:
  - Scans for 30+ banned hype words ("game-changer", "unleash", "mind-blowing", "insane", "revolutionary", etc.).
  - Counts emojis: Flags posts containing excessive emojis (> 3 emojis per post).
  - Checks capitalization: Flags sentences written in ALL CAPS.
  - Computes `spamScore`: Clean technical text receives 100/100; buzzwords deduct points.

### 3. Duplicate Detector (`rules/duplicate-detector.ts`)
- **Weight**: 25% of composite score.
- **Checks**:
  - Compares candidate post against past published posts in the database.
  - Computes Jaccard word-set similarity.
  - If `Jaccard >= 0.65`, flags post as a duplicate and penalizes score.
  - Prevents posting redundant variants on the same topic within 30 days.

### 4. Factual Veracity Verifier (`rules/veracity-checker.ts`)
- **Weight**: 25% of composite score.
- **Checks**:
  - Compares generated assertions against the citations and key facts recorded in the `ResearchReport`.
  - Flags claims not grounded in research sources.

### Composite Score Formula
$$ \text{Overall Score} = 0.25 \times \text{Platform} + 0.25 \times \text{Spam} + 0.25 \times \text{Duplicate} + 0.25 \times \text{Veracity} $$

- **Pass Threshold**: Overall score $\ge 70/100$, zero fatal platform errors, and zero sensitive exclusions.
- If passed, status is set to `APPROVED` (or `PUBLISHED` if autonomous mode is enabled).
- If failed, status is set to `NEEDS_REVISION` with a list of actionable error messages.

## Important Files
- `src/packages/quality-gate/rules/platform-validator.ts`: Character length & syntax.
- `src/packages/quality-gate/rules/spam-detector.ts`: Buzzword & emoji scanner.
- `src/packages/quality-gate/rules/duplicate-detector.ts`: Jaccard historical duplicate comparison.
- `src/packages/quality-gate/quality-gate.service.ts`: Master composite scorer.

## Code Example
```typescript
import { QualityGateService } from '@/packages/quality-gate/quality-gate.service';

const qualityGate = new QualityGateService();
const evaluation = await qualityGate.evaluateContent(contentId);

console.log(`Passed: ${evaluation.passed}, Overall Score: ${evaluation.overallScore}/100`);
if (!evaluation.passed) {
  console.error('Issues:', evaluation.issues);
}
```
