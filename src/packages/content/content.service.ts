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

    const unifiedSystemPrompt = `You are a distinguished software engineer and AI systems architect creating content for both LinkedIn and X.
VOICE CONSTRAINTS:
- Tone: ${voice.tone.join(', ')}
- Technical Depth: ${voice.technicalDepth}/10
- Humor Level: ${voice.humorLevel}/10
- Emoji Level: ${voice.emojiLevel}/10
- Avoid phrases: ${voice.avoidPhrases.join(', ')}

Adhere to the following rules:
1. For LinkedIn: Write an insightful post (700-1500 chars) with strong whitespace, practical developer perspective, and a discussion question.
2. For X: Provide a punchy single post (strictly <= 280 chars) AND a 4-5 tweet thread where each post is strictly <= 280 chars.
3. NEVER write generic motivational content or corporate marketing copy. Always explain the "why" for developers.`;

    const unifiedUserPrompt = `RESEARCH REPORT:
Topic: ${trend.title}
What Changed: ${report.whatChanged}
Why It Matters: ${report.whyItMatters}
Developer Impact: ${report.developerImpact}
Key Facts:
${JSON.parse(report.keyFacts).join('\n- ')}

Generate both the LinkedIn post and the X post/thread in structured JSON format.`;

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
        temperature: 0.6,
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

    // 3. Persist ContentItem & Variants
    const contentItem = await contentRepository.createContentItem({
      trendId: trend.id,
      researchReportId: report.id,
      status: 'DRAFT',
      variants: [
        {
          platform: 'LINKEDIN',
          text: gen.linkedin.text,
          hook: gen.linkedin.hook,
          characterCount: gen.linkedin.text.length,
          promptVersion: this.linkedinPromptVersion,
          model: response.model,
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
