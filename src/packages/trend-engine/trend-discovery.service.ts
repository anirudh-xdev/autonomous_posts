import { TrendSource, TrendCandidate, DiscoveryOptions } from './types';
import { HackerNewsSource } from './sources/hacker-news.source';
import { GitHubTrendingSource } from './sources/github-trending.source';
import { RedditSource } from './sources/reddit.source';
import { TechNewsRSSSource } from './sources/rss.source';
import { WebSearchTrendSource } from './sources/web-search.source';
import { SocialSignalsSource } from './sources/social-signals.source';
import { EngineerProfilesSource } from './sources/engineer-profiles.source';
import { trendClusterer } from './clustering/clusterer';
import { trendRepository, prisma } from '@/packages/database';
import { logger } from '@/packages/config';

export class TrendDiscoveryService {
  private sources: TrendSource[] = [];

  constructor() {
    this.registerDefaultSources();
  }

  private registerDefaultSources() {
    this.sources = [
      new HackerNewsSource(),
      new GitHubTrendingSource(),
      new RedditSource(),
      new TechNewsRSSSource(),
      new WebSearchTrendSource(),
      new SocialSignalsSource(),
      new EngineerProfilesSource(),
    ];
  }

  public registerSource(source: TrendSource) {
    this.sources.push(source);
  }

  public getSources(): TrendSource[] {
    return [...this.sources];
  }

  /**
   * Discovers trends across all enabled sources, clusters & deduplicates them,
   * scores them with transparent 5-factor weights, and saves to database.
   */
  async runDiscovery(options: DiscoveryOptions = {}): Promise<{
    rawCandidatesFound: number;
    canonicalTrendsSaved: number;
  }> {
    const startTime = Date.now();
    logger.info('🚀 TrendDiscoveryService: initiating multi-source discovery pipeline');

    const allCandidates: TrendCandidate[] = [];

    // Run sources in parallel with safe error isolation
    const results = await Promise.allSettled(
      this.sources.map(async (source) => {
        try {
          const items = await source.discover(options);
          logger.info(`Source [${source.name}] discovered ${items.length} candidate items`);
          return items;
        } catch (err) {
          logger.error(`Error during discovery for source [${source.name}]`, err);
          return [];
        }
      })
    );

    for (const res of results) {
      if (res.status === 'fulfilled') {
        allCandidates.push(...res.value);
      }
    }

    logger.info(`Total raw trend candidates gathered: ${allCandidates.length}`);

    // Cluster and deduplicate
    const canonicalGroups = trendClusterer.cluster(allCandidates);
    logger.info(`Clustered into ${canonicalGroups.length} canonical trend topics`);

    // Fetch source ID mappings from database
    const dbSources = await prisma.trendSource.findMany();
    const sourceMap = new Map(dbSources.map((s) => [s.adapterType, s.id]));
    const fallbackSourceId = dbSources[0]?.id || 'default-source';

    let savedCount = 0;

    for (const group of canonicalGroups) {
      const evidences = group.evidences.map((ev) => {
        let matchedSourceId = fallbackSourceId;
        for (const [adapterType, id] of sourceMap.entries()) {
          if (ev.sourceName.toLowerCase().includes(adapterType)) {
            matchedSourceId = id;
            break;
          }
        }

        return {
          sourceId: matchedSourceId,
          sourceName: ev.sourceName,
          sourceUrl: ev.sourceUrl,
          rawTitle: ev.rawTitle,
          snippet: ev.snippet,
          author: ev.author,
          rawScore: ev.rawScore,
          publishedAt: ev.publishedAt,
        };
      });

      await trendRepository.createOrMerge({
        title: group.canonicalTitle,
        slug: group.slug,
        summary: group.summary,
        score: group.score,
        freshnessScore: group.freshnessScore,
        developerRelevanceScore: group.developerRelevanceScore,
        engagementScore: group.engagementScore,
        noveltyScore: group.noveltyScore,
        credibilityScore: group.credibilityScore,
        scoreReason: group.scoreReason,
        topics: group.topics,
        evidences,
      });

      savedCount++;
    }

    logger.info('🎉 Trend discovery completed successfully', {
      rawCandidatesFound: allCandidates.length,
      canonicalTrendsSaved: savedCount,
      durationMs: Date.now() - startTime,
    });

    return {
      rawCandidatesFound: allCandidates.length,
      canonicalTrendsSaved: savedCount,
    };
  }
}

export const trendDiscoveryService = new TrendDiscoveryService();
