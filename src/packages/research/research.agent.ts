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
   * Researches a trend by aggregating primary evidence, fetching full READMEs / papers,
   * performing active multi-hop web search expansion, and extracting verified deep technical facts.
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

    // 1. Gather primary evidence texts & deep content
    const evidenceTexts: string[] = [];
    const sourceCitations: Array<{ title: string; url: string; credibility: number }> = [];

    for (const ev of trend.evidences) {
      evidenceTexts.push(`[Primary Evidence: ${ev.sourceName}]\nTitle: ${ev.rawTitle || trend.title}\nURL: ${ev.sourceUrl}\nSnippet: ${ev.snippet || 'None'}`);
      sourceCitations.push({
        title: ev.rawTitle || ev.sourceName,
        url: ev.sourceUrl,
        credibility: 9.5,
      });

      // Deep read of primary source (GitHub raw README, ArXiv paper, or full article text)
      if (ev.sourceUrl.startsWith('http') && !ev.sourceUrl.includes('twitter.com') && !ev.sourceUrl.includes('x.com')) {
        const body = await SourceReader.fetchContent(ev.sourceUrl);
        if (body && body.length > 50) {
          evidenceTexts.push(`--- Deep Primary Extraction (${ev.sourceUrl}) ---\n${body.slice(0, 8000)}`);
        }
      }
    }

    // 2. Active Multi-Hop Web Search Expansion
    // Query the live web for supplementary architecture breakdowns, benchmarks, and community reviews
    try {
      const cleanKeywords = trend.title
        .replace(/^[a-zA-Z0-9\s()&._-]+:\s*/, '') // Strip author prefix like "Simon Willison: "
        .replace(/[^\w\s-]/g, ' ')
        .trim()
        .slice(0, 70);

      if (cleanKeywords.length > 5) {
        const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cleanKeywords)}+architecture+OR+benchmark+OR+release&hl=en-US&gl=US&ceid=US:en`;
        const searchRes = await fetch(searchUrl, {
          headers: { 'User-Agent': 'AutonomusPosts-ResearchAgent/1.0' },
          signal: AbortSignal.timeout(5000),
        });

        if (searchRes.ok) {
          const xml = await searchRes.text();
          const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
          let match;
          let count = 0;

          while ((match = itemRegex.exec(xml)) !== null && count < 2) {
            const itemXml = match[1];
            const tMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
            const lMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/i);
            const sMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

            const supTitle = (tMatch ? (tMatch[1] || tMatch[2]) : '').trim().replace(/<[^>]+>/g, '');
            const supUrl = (lMatch ? (lMatch[1] || lMatch[2]) : '').trim();
            const supSource = sMatch ? sMatch[1].trim() : 'Web Intelligence';

            if (supTitle && supUrl && !sourceCitations.some((c) => c.url === supUrl)) {
              sourceCitations.push({
                title: supTitle,
                url: supUrl,
                credibility: 8.8,
              });

              // Attempt brief fetch of supplementary article
              const supBody = await SourceReader.fetchContent(supUrl, 3000);
              evidenceTexts.push(
                `--- Supplementary Web Analysis [${supSource}]: "${supTitle}" (${supUrl}) ---\n${
                  supBody ? supBody.slice(0, 2000) : 'Discovered in live web news.'
                }`
              );
              count++;
            }
          }
        }
      }
    } catch (searchErr) {
      logger.debug(`ResearchAgent: web search expansion skipped for trend ${trendId}`, { error: String(searchErr) });
    }

    const compiledEvidence = evidenceTexts.join('\n\n========================================\n\n');

    // 3. Load prompt template & render with Principal Architect persona
    const template = PromptManager.getPrompt(this.promptVersion);
    const rendered = PromptManager.render(template, {
      title: trend.title,
      summary: trend.summary,
      evidenceText: compiledEvidence,
    });

    // 4. Query LLM for structured fact extraction
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

    // 5. Save to Database
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

    logger.info(`✅ Deep research completed for trend ${trendId} with ${reportData.confidence}% confidence`, {
      durationMs: Date.now() - startTime,
      factsCount: reportData.keyFacts.length,
      citationsCount: reportData.sources.length,
    });

    return reportData;
  }
}

export const researchAgent = new ResearchAgent();
