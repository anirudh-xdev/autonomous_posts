# Content Generation, Voice Profiles & Platform Specs

## Overview
The Content Generation Engine translates structured research dossiers into platform-tailored, high-signal technical posts for LinkedIn and X. It strictly avoids generic AI buzzwords and enforces platform character and formatting constraints.

## Voice Persona & Brand Guidelines
The generated content reflects an experienced software architect or senior AI engineer sharing practical insights with peers:
- **Tone**: Analytical, pragmatic, and authoritative.
- **Core Directive**: Answer *"What does this actually mean for developers building production systems today?"*
- **Banned Words**: Posts containing "game-changer", "revolutionary", "unleash", "mind-blowing", "supercharge", "paradigm shift" are automatically penalized by the quality gate.
- **Formatting**: Short, readable paragraphs; bullet points for engineering comparisons; maximum 2–3 emojis per post; ends with a technical discussion question.

## Platform Post Specifications

### 1. LinkedIn Post Specification
- **Character Count**: 700 to 1,500 characters (optimal for LinkedIn algorithmic engagement).
- **Post Structure**:
  1. **Hook**: Direct statement of the engineering breakthrough or release (no clickbait).
  2. **Technical Context**: Explanation of how the architecture works under the hood.
  3. **Engineering Implications**: Bulleted takeaways on latency, memory, cost, or developer productivity.
  4. **Trade-offs**: Honest analysis of limitations, hardware requirements, or licensing.
  5. **Discussion Prompt**: Open technical question for fellow engineers.
  6. **Hashtags**: 3–5 relevant technical tags (e.g. `#MachineLearning`, `#SoftwareEngineering`, `#LLMOps`).

### 2. X (Twitter) Post & Thread Specification
- **Single Tweet**: Strictly $\le 280$ characters. Delivers an punchy technical summary with an actionable takeaway.
- **Multi-Tweet Thread**: 3 to 7 tweets.
  - **Tweet 1 (Root)**: Hook + headline technical release.
  - **Tweet 2–4**: Deep architectural breakdown, benchmark metrics, or code flow.
  - **Tweet 5–6**: Trade-offs, hardware considerations, or repository link.
  - **Tweet 7**: Summary + technical discussion prompt.
  - **Validation**: Every single tweet in the thread is verified against the 280-character boundary.

## Multi-Variant Generation
When content is generated, the engine creates 2 distinct editorial variants:
- **Variant A (Analytical / Architectural Breakdown)**: Focuses on internal mechanics, attention mechanisms, or data engineering.
- **Variant B (Pragmatic / Developer Takeaways)**: Focuses on deployment, tooling integration, cost savings, and developer productivity.

In the Next.js Review Dashboard, users can view variants side-by-side, inspect character counts, preview formatting, and select the best candidate.
