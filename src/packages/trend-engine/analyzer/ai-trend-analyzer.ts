import { z } from 'zod';
import { LLMProvider, LLMProviderFactory, PromptManager } from '@/packages/ai';
import { CanonicalTrendGroup } from '../types';
import { logger } from '@/packages/config';

export const AITrendAnalysisSchema = z.object({
  trendTitle: z.string(),
  summary: z.string(),
  whatChanged: z.string().default(''),
  developerRelevance: z.number().min(0).max(10),
  velocity: z.number().min(0).max(10),
  novelty: z.number().min(0).max(10),
  sourceAuthority: z.number().min(0).max(10),
  crossSourceConfirmation: z.number().min(0).max(10),
  technicalDepth: z.number().min(0).max(10),
  contentPotential: z.number().min(0).max(10),
  confidence: z.number().min(0).max(100),
  confirmedFacts: z.array(z.string()).default([]),
  uncertainClaims: z.array(z.string()).default([]),
  recommendedAngle: z.string().default(''),
  sources: z.array(z.string()).optional().default([]),
});

export type AITrendAnalysis = z.infer<typeof AITrendAnalysisSchema>;

export class AITrendAnalyzer {
  private llmProvider: LLMProvider;
  private promptVersion = 'trend-analyzer.v1';

  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider || LLMProviderFactory.getDefault();
  }

  /**
   * Evaluates a candidate trend cluster using the AI Trend Analyzer prompt.
   * Extracts confirmed facts, what changed, developer relevance, and 7-factor evaluations.
   */
  async analyzeCluster(cluster: CanonicalTrendGroup): Promise<AITrendAnalysis | null> {
    try {
      const template = PromptManager.getPrompt(this.promptVersion);

      const evidenceFormatted = cluster.evidences
        .map(
          (ev, idx) =>
            `[Signal ${idx + 1} | ${ev.sourceName} (${ev.sourceType})]\nTitle: ${ev.rawTitle}\nURL: ${ev.sourceUrl}\nSnippet: ${ev.snippet || 'None'}`
        )
        .join('\n\n');

      const rendered = PromptManager.render(template, {
        title: cluster.canonicalTitle,
        summary: cluster.summary,
        topics: cluster.topics.join(', '),
        evidences: evidenceFormatted.slice(0, 6000),
      });

      logger.info(`AITrendAnalyzer: evaluating cluster "${cluster.canonicalTitle}" with ${cluster.evidences.length} signals`);

      const response = await this.llmProvider.generateStructured<AITrendAnalysis>({
        messages: [
          { role: 'system', content: rendered.system },
          { role: 'user', content: rendered.user },
        ],
        schema: AITrendAnalysisSchema,
        schemaName: 'AITrendAnalysis',
        temperature: 0.2,
        maxTokens: 1500,
      });

      logger.info(`AITrendAnalyzer: analysis finished for "${response.data.trendTitle}" (confidence: ${response.data.confidence}%)`);
      return response.data;
    } catch (err) {
      logger.warn(`AITrendAnalyzer: LLM evaluation failed or timed out for "${cluster.canonicalTitle}", using deterministic fallback`, err);
      return null;
    }
  }
}

export const aiTrendAnalyzer = new AITrendAnalyzer();
