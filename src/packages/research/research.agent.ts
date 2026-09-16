import { ResearchReportData, ResearchReportDataSchema, ResearchOptions } from './types';
import { SourceReader } from './source-reader';
import { LLMProvider, LLMProviderFactory, PromptManager } from '@/packages/ai';
import { prisma, agentRunRepository } from '@/packages/database';
import { logger, NotFoundError } from '@/packages/config';

export class ResearchAgent {
  private llmProvider: LLMProvider;
  private promptVersion = 'research.v1';

  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider || LLMProviderFactory.getDefault();
  }

  /**
   * Researches a trend by aggregating evidence, reading primary sources,
   * extracting verified facts and technical deltas, and persisting the report.
   */
  async researchTrend(trendId: string, options: ResearchOptions = {}): Promise<ResearchReportData> {
    const startTime = Date.now();
    logger.info(`🔬 ResearchAgent: beginning deep technical research on trend ${trendId}`);

    const trend = await prisma.trend.findUnique({
      where: { id: trendId },
      include: { evidences: true, researchReport: true },
    });

    if (!trend) {
      throw new NotFoundError('Trend', trendId);
    }

    if (trend.researchReport && !options.forceRefresh) {
      logger.info(`Research report already exists for trend ${trendId}`);
      return {
        keyFacts: JSON.parse(trend.researchReport.keyFacts),
        whatChanged: trend.researchReport.whatChanged,
        whyItMatters: trend.researchReport.whyItMatters,
        developerImpact: trend.researchReport.developerImpact,
        uncertainties: JSON.parse(trend.researchReport.uncertainties),
        sources: JSON.parse(trend.researchReport.sources),
        confidence: trend.researchReport.confidence,
      };
    }

    await prisma.trend.update({
      where: { id: trendId },
      data: { status: 'RESEARCHING' },
    });

    // 1. Gather evidence texts
    const evidenceTexts: string[] = [];
    const sourceCitations: Array<{ title: string; url: string; credibility: number }> = [];

    for (const ev of trend.evidences) {
      evidenceTexts.push(`Source: ${ev.sourceName}\nURL: ${ev.sourceUrl}\nTitle: ${ev.rawTitle}\nSnippet: ${ev.snippet || 'None'}`);
      sourceCitations.push({
        title: ev.rawTitle || ev.sourceName,
        url: ev.sourceUrl,
        credibility: 9.0,
      });

      // Attempt to read body text of primary source if available
      if (ev.sourceUrl.startsWith('http') && !ev.sourceUrl.includes('twitter.com') && !ev.sourceUrl.includes('x.com')) {
        const body = await SourceReader.fetchContent(ev.sourceUrl);
        if (body) {
          evidenceTexts.push(`Full excerpt from ${ev.sourceUrl}:\n${body.slice(0, 1000)}...`);
        }
      }
    }

    const compiledEvidence = evidenceTexts.join('\n\n---\n\n');

    // 2. Load prompt template
    const template = PromptManager.getPrompt(this.promptVersion);
    const rendered = PromptManager.render(template, {
      title: trend.title,
      summary: trend.summary,
      evidenceText: compiledEvidence,
    });

    // 3. Query LLM for structured fact extraction
    let response;
    try {
      response = await this.llmProvider.generateStructured<ResearchReportData>({
        messages: [
          { role: 'system', content: rendered.system },
          { role: 'user', content: rendered.user },
        ],
        schema: ResearchReportDataSchema,
        schemaName: 'ResearchReportDataSchema',
        temperature: 0.2,
      });

      // Record agent run
      await agentRunRepository.record({
        agentType: 'RESEARCH',
        model: response.model,
        provider: response.provider,
        promptVersion: this.promptVersion,
        inputData: { trendId, title: trend.title },
        outputData: response.data,
        tokensUsed: response.tokensUsed.totalTokens,
        latencyMs: response.latencyMs,
        status: 'SUCCESS',
      });
    } catch (err) {
      await agentRunRepository.record({
        agentType: 'RESEARCH',
        model: 'unknown',
        provider: this.llmProvider.name,
        promptVersion: this.promptVersion,
        inputData: { trendId, title: trend.title },
        status: 'FAILED',
        error: String(err),
      });

      await prisma.trend.update({
        where: { id: trendId },
        data: { status: 'DISCOVERED' },
      });

      throw err;
    }

    const reportData = response.data;

    // Ensure at least the trend's original sources are represented in citations
    if (reportData.sources.length === 0 && sourceCitations.length > 0) {
      reportData.sources = sourceCitations;
    }

    // 4. Save to Database
    await prisma.researchReport.upsert({
      where: { trendId },
      update: {
        keyFacts: JSON.stringify(reportData.keyFacts),
        whatChanged: reportData.whatChanged,
        whyItMatters: reportData.whyItMatters,
        developerImpact: reportData.developerImpact,
        uncertainties: JSON.stringify(reportData.uncertainties),
        sources: JSON.stringify(reportData.sources),
        confidence: reportData.confidence,
      },
      create: {
        trendId,
        keyFacts: JSON.stringify(reportData.keyFacts),
        whatChanged: reportData.whatChanged,
        whyItMatters: reportData.whyItMatters,
        developerImpact: reportData.developerImpact,
        uncertainties: JSON.stringify(reportData.uncertainties),
        sources: JSON.stringify(reportData.sources),
        confidence: reportData.confidence,
      },
    });

    // Update trend status to RESEARCHED
    await prisma.trend.update({
      where: { id: trendId },
      data: { status: 'RESEARCHED' },
    });

    logger.info(`✅ Research completed for trend ${trendId} with ${reportData.confidence}% confidence`, {
      durationMs: Date.now() - startTime,
      factsCount: reportData.keyFacts.length,
    });

    return reportData;
  }
}

export const researchAgent = new ResearchAgent();
