import { ContentGenerationResult, ContentGenerationResultSchema, GenerateContentOptions } from './types';
import { VoiceProfileService } from './voice.service';
import { LLMProvider, LLMProviderFactory, PromptManager } from '@/packages/ai';
import { prisma, contentRepository, agentRunRepository } from '@/packages/database';
import { logger, NotFoundError, ValidationError } from '@/packages/config';

export class ContentService {
  private llmProvider: LLMProvider;
  private linkedinPromptVersion = 'linkedin.v1';
  private xPromptVersion = 'x.v1';

  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider || LLMProviderFactory.getDefault();
  }

  /**
   * Generates LinkedIn and X content for a researched trend
   */
  async generateForTrend(trendId: string, options: GenerateContentOptions = {}): Promise<{
    contentItemId: string;
    result: ContentGenerationResult;
  }> {
    const startTime = Date.now();
    logger.info(`✍️ ContentService: generating platform posts for trend ${trendId}`);

    const trend = await prisma.trend.findUnique({
      where: { id: trendId },
      include: { researchReport: true, contentItems: { include: { variants: true } } },
    });

    if (!trend) {
      throw new NotFoundError('Trend', trendId);
    }

    if (!trend.researchReport) {
      throw new ValidationError('Cannot generate content for an unresearched trend. Run research first.');
    }

    const report = trend.researchReport;
    const voice = await VoiceProfileService.getActiveProfile();

    // 1. Prepare prompt variables
    const promptVariables = {
      title: trend.title,
      whatChanged: report.whatChanged,
      whyItMatters: report.whyItMatters,
      developerImpact: report.developerImpact,
      keyFacts: JSON.parse(report.keyFacts),
      tone: voice.tone.join(', '),
      audience: voice.audience.join(', '),
      technicalDepth: voice.technicalDepth,
      humorLevel: voice.humorLevel,
      emojiLevel: voice.emojiLevel,
      avoidPhrases: voice.avoidPhrases.join('; '),
      preferredStructure: voice.preferredStructure.join(' -> '),
    };

    const linkedinTemplate = PromptManager.getPrompt(this.linkedinPromptVersion);
    const renderedLinkedin = PromptManager.render(linkedinTemplate, promptVariables);

    const xTemplate = PromptManager.getPrompt(this.xPromptVersion);
    const renderedX = PromptManager.render(xTemplate, promptVariables);

    const unifiedSystemPrompt = `You are a distinguished senior software engineer and systems architect writing authentic developer content for LinkedIn and X.
Your writing is praised because it is clear, grounded, and human. You explain complex technical changes the way an experienced developer explains them to a peer over coffee.

CRITICAL WRITING PRINCIPLES:
1. NATURAL HUMAN LANGUAGE:
   - Use common, natural words instead of unnecessarily complex, rarely used, or overly academic words.
   - BANNED BUZZWORDS & JARGON: NEVER use "shifts the paradigm", "paradigm shift", "declarative model-driven", "deterministic privacy-preserving", "game changer", "revolutionary", "unleash", "supercharge", "delve", "testament to", "spearheading", "groundbreaking", "cutting-edge".
   - If a sentence has stacked buzzwords or academic jargon, rewrite it in plain English.

2. STRUCTURE & WHITESPACE (NO WALL OF TEXT):
   - Every paragraph MUST be short: strictly 1 to 2 sentences maximum.
   - Separate EVERY paragraph with a blank line (\\n\\n). A dense single paragraph or wall of text is completely unacceptable.
   - Use bullet points (•) for scannable breakdowns.

3. THE 5 CORE EXPLANATION PILLARS (Every post must cover these):
   ① What happened: A clean, natural opening stating what was released or discovered without hype.
   ② What changed: 1-2 short sentences contrasting the old painful developer workflow with the new approach.
   ③ Why it matters: The bigger engineering and architectural picture.
   ④ Why developers/AI engineers should care: 2-3 scannable bullet points (•) highlighting concrete benefits (e.g. speed, cost, ergonomics, architecture, reliability).
   ⑤ The practical takeaway: Exactly how an engineer can evaluate, use, or think about this today.
   End with a genuine, conversational technical discussion question, followed by 1-2 relevant hashtags.

4. VISUAL REFERENCES (RECOMMEND 1-2 GENUINE VISUALS):
   When the topic would benefit from a visual explanation, identify 1-2 relevant images/diagrams/screenshots:
   - "architecture_diagram": For protocols, client-server models, or distributed agent pipelines (e.g. MCP host-client-server).
   - "product_screenshot": For developer tools, IDE extensions, CLI tools, or debuggers.
   - "benchmark_chart": For model evaluations, throughput benchmarks, latency comparisons.
   - "concept_diagram": For complex concepts (e.g. speculative decoding, memory mapping).
   - "official_image": For official release announcements or model infographics.
   Only recommend visuals that genuinely improve understanding (never decorative stock photos). Prefer official sources (GitHub, official lab blog).

5. PLATFORM SPECIFICS:
   - LinkedIn: 1400-2600 characters (~200-420 words). Provide thorough, in-depth technical analysis across the 5 pillars without cutting off explanations. Strong whitespace (\\n\\n), 1-2 sentence paragraphs, bullet points, discussion question.
   - X Standalone: Strictly under 270 characters. Punchy, conversational, states what happened and the practical takeaway.
   - X Thread: 4-5 tweets, each strictly under 270 characters:
     * Tweet 1: Hook + what happened (🧵)
     * Tweet 2: The old pain vs what changed
     * Tweet 3: Technical mechanics / architecture breakdown
     * Tweet 4: Developer takeaway & practical impact
     * Tweet 5: Discussion question or official repo/doc reference

VOICE CONSTRAINTS:
- Tone: ${voice.tone.join(', ')}
- Technical Depth: ${voice.technicalDepth}/10
- Humor Level: ${voice.humorLevel}/10
- Emoji Level: ${voice.emojiLevel}/10 (0-2 max)
- Avoid phrases: ${voice.avoidPhrases.join(', ')}

CRITICAL JSON FORMAT:
Respond ONLY with a valid JSON object matching this schema:
{
  "linkedin": {
    "hook": "Strong, natural opening hook stating what happened",
    "text": "Full, substantive LinkedIn post text (1400-2600 chars, ~200-420 words) with short paragraphs (1-2 sentences), blank lines (\\\\n\\\\n), bullet points (•), 5 pillars, discussion question, and 1-2 hashtags. DO NOT truncate or cut off prematurely."
  },
  "x": {
    "hook": "Punchy tweet hook",
    "text": "Single tweet under 270 chars stating what happened and why it matters",
    "isThread": true,
    "posts": [
      "Tweet 1 under 270 chars (hook + what happened 🧵)",
      "Tweet 2 under 270 chars (the old pain vs what changed)",
      "Tweet 3 under 270 chars (technical mechanics / architecture)",
      "Tweet 4 under 270 chars (practical developer takeaway)",
      "Tweet 5 under 270 chars (discussion question or official link)"
    ]
  },
  "visuals": [
    {
      "type": "architecture_diagram",
      "title": "Descriptive title of the diagram or screenshot",
      "description": "Clear explanation of what the visual should show",
      "suggestedSourceUrl": "https://github.com/... or official blog URL",
      "reasonWhyHelpful": "Why this visual aids developer understanding"
    }
  ],
  "reasoning": {
    "angle": "The core technical angle taken",
    "developerInsight": "Why this matters for practicing engineers"
  }
}`;

    const unifiedUserPrompt = `RESEARCH REPORT:
Topic: ${trend.title}
What Changed: ${report.whatChanged}
Why It Matters: ${report.whyItMatters}
Developer Impact: ${report.developerImpact}
Key Facts:
${JSON.parse(report.keyFacts).join('\n- ')}

Write the LinkedIn post, the X standalone post & thread, and recommend 1-2 genuine visual references. Adhere strictly to short paragraphs, double spacing (\\n\\n), human conversational tone, and the required JSON schema.`;

    // 2. Query LLM
    let response;
    try {
      response = await this.llmProvider.generateStructured<ContentGenerationResult>({
        messages: [
          { role: 'system', content: unifiedSystemPrompt },
          { role: 'user', content: unifiedUserPrompt },
        ],
        schema: ContentGenerationResultSchema,
        schemaName: 'ContentGenerationResultSchema',
        temperature: 0.35,
        maxTokens: 4000,
      });

      // Record agent run
      await agentRunRepository.record({
        agentType: 'LINKEDIN_AND_X_GENERATION',
        model: response.model,
        provider: response.provider,
        promptVersion: `${this.linkedinPromptVersion}+${this.xPromptVersion}`,
        inputData: { trendId, title: trend.title },
        outputData: response.data,
        tokensUsed: response.tokensUsed.totalTokens,
        latencyMs: response.latencyMs,
        status: 'SUCCESS',
      });
    } catch (err) {
      await agentRunRepository.record({
        agentType: 'LINKEDIN_AND_X_GENERATION',
        model: 'unknown',
        provider: this.llmProvider.name,
        promptVersion: `${this.linkedinPromptVersion}+${this.xPromptVersion}`,
        inputData: { trendId, title: trend.title },
        status: 'FAILED',
        error: String(err),
      });
      throw err;
    }

    const gen = response.data;

    // 3. Persist ContentItem & Variants with Visual References
    const contentItem = await contentRepository.createContentItem({
      trendId: trend.id,
      researchReportId: report.id,
      status: 'DRAFT',
      visualReferences: gen.visuals,
      variants: [
        {
          platform: 'LINKEDIN',
          text: gen.linkedin.text,
          hook: gen.linkedin.hook,
          characterCount: gen.linkedin.text.length,
          promptVersion: this.linkedinPromptVersion,
          model: response.model,
          visualReferences: gen.visuals,
        },
        {
          platform: 'X',
          text: gen.x.text,
          hook: gen.x.hook,
          isThread: gen.x.isThread,
          threadPosts: gen.x.posts,
          characterCount: gen.x.text.length,
          promptVersion: this.xPromptVersion,
          model: response.model,
          visualReferences: gen.visuals,
        },
      ],
    });

    // Update trend status to DRAFTED
    await prisma.trend.update({
      where: { id: trendId },
      data: { status: 'DRAFTED' },
    });

    logger.info(`✅ Generated content item ${contentItem.id} for trend ${trendId}`, {
      durationMs: Date.now() - startTime,
      linkedinChars: gen.linkedin.text.length,
      xChars: gen.x.text.length,
    });

    return {
      contentItemId: contentItem.id,
      result: gen,
    };
  }
}

export const contentService = new ContentService();
