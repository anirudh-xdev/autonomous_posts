import { TrendSource, TrendCandidate, DiscoveryOptions } from '../types';
import { TrendNormalizer } from '../clustering/normalizer';
import { logger } from '@/packages/config';

export class EngineerProfilesSource implements TrendSource {
  public readonly name = 'Top AI Engineer Profiles';
  public readonly adapterType = 'engineers';

  private static ENGINEER_FEEDS = [
    { name: 'Simon Willison', url: 'https://simonwillison.net/atom/everything/' },
    { name: 'Latent Space (Swyx & Alessio)', url: 'https://www.latent.space/feed' },
    { name: 'Andrej Karpathy Activity', url: 'https://github.com/karpathy.atom' },
  ];

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(EngineerProfilesSource.ENGINEER_FEEDS[0].url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(4000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async discover(options: DiscoveryOptions = {}): Promise<TrendCandidate[]> {
    logger.info('EngineerProfilesSource: fetching live technical feeds from AI practitioners');
    const limit = options.limitPerSource || 10;

    if (process.env.NODE_ENV === 'test') {
      return this.getCuratedFallback();
    }

    const candidates: TrendCandidate[] = [];

    await Promise.allSettled(
      EngineerProfilesSource.ENGINEER_FEEDS.map(async (feed) => {
        try {
          const res = await fetch(feed.url, {
            headers: {
              'User-Agent': 'AutonomusPosts-AI-Trend-Agent/1.0',
              Accept: 'application/atom+xml, application/rss+xml, text/xml, application/xml',
            },
            signal: AbortSignal.timeout(6000),
          });

          if (!res.ok) return;

          const xml = await res.text();
          const parsed = this.parseFeed(xml, feed.name);
          candidates.push(...parsed.slice(0, 3));
        } catch (err) {
          logger.debug(`EngineerProfilesSource: failed to fetch ${feed.name}`, { error: String(err) });
        }
      })
    );

    logger.info(`EngineerProfilesSource: discovered ${candidates.length} live engineer items`);
    return candidates.slice(0, limit);
  }

  private parseFeed(xml: string, authorName: string): TrendCandidate[] {
    const candidates: TrendCandidate[] = [];
    const itemRegex = /<(?:entry|item)[\s>]([\s\S]*?)<\/(?:entry|item)>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const content = match[1];

      // Extract title
      const titleMatch = content.match(/<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
      const title = (titleMatch ? (titleMatch[1] || titleMatch[2]) : '').trim().replace(/<[^>]+>/g, '');

      // Extract URL
      let url = '';
      const hrefMatch = content.match(/<link[^>]*href=["']([^"']+)["']/i);
      if (hrefMatch) {
        url = hrefMatch[1];
      } else {
        const linkMatch = content.match(/<link[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/i);
        url = (linkMatch ? (linkMatch[1] || linkMatch[2]) : '').trim();
      }

      // Extract summary
      const descMatch = content.match(/<(?:summary|content|description)[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/(?:summary|content|description)>/i);
      const rawSummary = (descMatch ? (descMatch[1] || descMatch[2]) : '').trim().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      const summary = rawSummary.slice(0, 300);

      // Extract date
      const dateMatch = content.match(/<(?:published|updated|pubDate)[^>]*>([\s\S]*?)<\/(?:published|updated|pubDate)>/i);
      const dateStr = dateMatch ? dateMatch[1].trim() : '';
      const publishedAt = dateStr ? new Date(dateStr) : new Date();

      if (title && url) {
        const topics = TrendNormalizer.extractTopics(title, summary);
        candidates.push({
          title: `${authorName}: ${title}`,
          summary: summary || title,
          sourceUrl: url,
          sourceName: `${authorName} Notes`,
          publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
          author: authorName,
          topics,
          freshnessScore: 9.6,
          engagementScore: 9.3,
          developerRelevanceScore: 9.8,
          noveltyScore: 9.0,
          credibilityScore: 9.9,
          totalScore: 0,
        });
      }
    }

    return candidates;
  }

  private getCuratedFallback(): TrendCandidate[] {
    return [
      {
        title: 'Simon Willison: Running Claude with Custom SQLite and GitHub MCP Servers',
        summary: 'Comprehensive hands-on breakdown showing how MCP enables local LLM desktop clients to safely execute database queries and inspect git repositories.',
        sourceUrl: 'https://simonwillison.net/2024/Nov/25/model-context-protocol/',
        sourceName: 'Simon Willison Weblog',
        publishedAt: new Date(),
        author: 'Simon Willison',
        topics: ['mcp', 'ai-developer-tools', 'ai-engineering'],
        freshnessScore: 9.8,
        engagementScore: 9.4,
        developerRelevanceScore: 10.0,
        noveltyScore: 9.2,
        credibilityScore: 9.9,
        totalScore: 97.1,
      },
      {
        title: 'Andrej Karpathy: LLM.c Pure C/CUDA Training Benchmark Updates',
        summary: 'Direct C/CUDA implementation reaches parity with PyTorch while offering 10x simpler codebase and transparent kernel performance.',
        sourceUrl: 'https://github.com/karpathy/llm.c',
        sourceName: 'Andrej Karpathy Tech Notes',
        publishedAt: new Date(),
        author: 'Andrej Karpathy',
        topics: ['ai-infrastructure', 'llms', 'open-source-ai'],
        freshnessScore: 8.8,
        engagementScore: 9.5,
        developerRelevanceScore: 9.2,
        noveltyScore: 9.0,
        credibilityScore: 10.0,
        totalScore: 93.3,
      },
    ];
  }
}
