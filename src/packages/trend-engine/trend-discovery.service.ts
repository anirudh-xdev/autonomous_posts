import { TrendSource, TrendCandidate, DiscoveryOptions, CanonicalTrendGroup } from './types';
import { HackerNewsSource } from './sources/hacker-news.source';
import { GitHubTrendingSource } from './sources/github-trending.source';
import { RedditSource } from './sources/reddit.source';
import { TechNewsRSSSource } from './sources/rss.source';
import { WebSearchTrendSource } from './sources/web-search.source';
import { SocialSignalsSource } from './sources/social-signals.source';
import { EngineerProfilesSource } from './sources/engineer-profiles.source';
import { SourceRegistry } from './sources/source-registry';
import { TopicRegistry } from './topics/topic-registry';
import { trendClusterer } from './clustering/clusterer';
import { aiTrendAnalyzer } from './analyzer/ai-trend-analyzer';
import { trendScorer } from './scoring/scorer';
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
   * evaluates high-value candidates with AI Trend Analyzer, scores with transparent 7 factors,
   * tracks source health, and stores top 10 trends.
   */
  async runDiscovery(options: DiscoveryOptions = {}): Promise<{
    rawCandidatesFound: number;
    canonicalTrendsSaved: number;
  }> {
    const startTime = Date.now();
    logger.info('🚀 TrendDiscoveryService: initiating multi-source 5-tier discovery pipeline');

    // 1. Ensure Source and Topic registries are seeded
    try {
      await SourceRegistry.seedDefaults(prisma);
      await TopicRegistry.seedDefaults(prisma);
    } catch (seedErr) {
      logger.warn('TrendDiscoveryService: Registry seeding warning (non-fatal)', seedErr);
    }

    // 2. Fetch source health / enabled records from database
    const dbSources = await prisma.trendSource.findMany();
    const dbSourceMap = new Map(dbSources.map((s) => [s.adapterType, s]));

    const allCandidates: TrendCandidate[] = [];
    const sourceTexts: string[] = [];

    // 3. Run enabled sources in parallel with health tracking
    const results = await Promise.allSettled(
      this.sources.map(async (source) => {
        const dbRecord = dbSourceMap.get(source.adapterType);
        if (dbRecord && !dbRecord.enabled) {
          logger.info(`Source [${source.name}] is disabled in registry, skipping.`);
          return [];
        }

        try {
          const items = await source.discover(options);
          logger.info(`Source [${source.name}] discovered ${items.length} candidate items`);

          // Update source health on success
          if (dbRecord) {
            await prisma.trendSource.update({
              where: { id: dbRecord.id },
              data: {
                lastPolledAt: new Date(),
                lastCheckedAt: new Date(),
                lastSuccessAt: new Date(),
                lastError: null,
                failureCount: 0,
                itemsFound: items.length,
              },
            }).catch(() => {});
          }

          return items;
        } catch (err) {
          logger.error(`Error during discovery for source [${source.name}]`, err);

          // Update source health on failure
          if (dbRecord) {
            const nextFailureCount = (dbRecord.failureCount || 0) + 1;
            await prisma.trendSource.update({
              where: { id: dbRecord.id },
              data: {
                lastCheckedAt: new Date(),
                lastError: String(err).slice(0, 500),
                failureCount: nextFailureCount,
                enabled: nextFailureCount < 5, // Auto-disable after 5 consecutive failures
              },
            }).catch(() => {});
          }

          return [];
        }
      })
    );

    for (const res of results) {
      if (res.status === 'fulfilled') {
        allCandidates.push(...res.value);
        for (const item of res.value) {
          sourceTexts.push(`${item.title} ${item.summary}`);
        }
      }
    }

    logger.info(`Total raw trend candidates gathered: ${allCandidates.length}`);

    // 4. Cluster and deduplicate across 4 layers
    const canonicalGroups = trendClusterer.cluster(allCandidates);
    logger.info(`Clustered into ${canonicalGroups.length} canonical trend topics`);

    // 5. Dynamic Keyword Discovery in background
    if (sourceTexts.length > 0) {
      TopicRegistry.discoverEmergingKeywords(prisma, sourceTexts).catch((err) => {
        logger.debug('Dynamic keyword discovery non-fatal error', err);
      });
    }

    // 6. Rank canonical groups by total score descending
    canonicalGroups.sort((a, b) => b.score - a.score);

    // Limit to requested limit (default 10 canonical trends)
    const limit = options.limit ?? 10;
    const topCanonicalGroups = limit > 0 ? canonicalGroups.slice(0, limit) : canonicalGroups;

    // 7. Pass top 3 highest-ranking candidate clusters through AI Trend Analyzer (Nemotron 3.5 Lightning)
    // Only analyze top candidates to optimize cost & speed
    const enrichedGroups: CanonicalTrendGroup[] = [];
    const topForAI = topCanonicalGroups.slice(0, 3);
    const remainingForDeterministic = topCanonicalGroups.slice(3);

    for (const group of topForAI) {
      if (process.env.NODE_ENV !== 'test') {
        const analysis = await aiTrendAnalyzer.analyzeCluster(group);
        if (analysis) {
          // Reject if AI assigns very low confidence (< 60)
          if (analysis.confidence < 60) {
            logger.info(`AITrendAnalyzer rejected low-signal candidate: "${group.canonicalTitle}" (confidence: ${analysis.confidence}%)`);
            continue;
          }

          // Merge AI evaluation into group
          const aiScored = trendScorer.scoreCandidate(
            {
              ...group,
              title: analysis.trendTitle || group.canonicalTitle,
              summary: analysis.summary || group.summary,
              developerRelevanceScore: analysis.developerRelevance,
              velocityScore: analysis.velocity,
              noveltyScore: analysis.novelty,
              sourceAuthorityScore: analysis.sourceAuthority,
              crossSourceScore: analysis.crossSourceConfirmation,
              technicalDepthScore: analysis.technicalDepth,
              contentPotentialScore: analysis.contentPotential,
              confidence: analysis.confidence,
              whatChanged: analysis.whatChanged,
              recommendedAngle: analysis.recommendedAngle,
              freshnessScore: analysis.velocity,
              engagementScore: group.engagementScore,
              credibilityScore: analysis.sourceAuthority,
              sourceName: group.evidences[0]?.sourceName || 'Consensus',
              sourceUrl: group.evidences[0]?.sourceUrl || '',
              topics: group.topics,
              totalScore: 0,
            },
            group.evidences.length,
            group.independentSourceTypes.length
          );

          enrichedGroups.push({
            ...group,
            canonicalTitle: analysis.trendTitle || group.canonicalTitle,
            summary: analysis.summary || group.summary,
            score: aiScored.totalScore,
            developerRelevanceScore: aiScored.developerRelevanceScore,
            velocityScore: aiScored.velocityScore || group.velocityScore,
            noveltyScore: aiScored.noveltyScore,
            sourceAuthorityScore: aiScored.sourceAuthorityScore || group.sourceAuthorityScore,
            crossSourceScore: aiScored.crossSourceScore || group.crossSourceScore,
            technicalDepthScore: aiScored.technicalDepthScore || group.technicalDepthScore,
            contentPotentialScore: aiScored.contentPotentialScore || group.contentPotentialScore,
            confidence: analysis.confidence,
            whatChanged: analysis.whatChanged,
            recommendedAngle: analysis.recommendedAngle,
            confirmedFacts: analysis.confirmedFacts,
            uncertainClaims: analysis.uncertainClaims,
            scoreReason: aiScored.scoreReason || group.scoreReason,
          });
          continue;
        }
      }

      // Fallback: keep deterministic scores
      enrichedGroups.push(group);
    }

    // Add remaining candidates with deterministic 7-factor scores
    enrichedGroups.push(...remainingForDeterministic);

    // Sort final enriched candidates
    enrichedGroups.sort((a, b) => b.score - a.score);
    const finalTopGroups = limit > 0 ? enrichedGroups.slice(0, limit) : enrichedGroups;

    // 8. Default replaceUnsaved is true: rotate out old un-saved, un-researched trends
    if (options.replaceUnsaved !== false) {
      const rotatedOut = await trendRepository.deleteUnsavedDiscovered();
      logger.info(`Rotated out ${rotatedOut} un-saved/un-researched trends before storing new trends`);
    }

    // 9. Fetch latest source ID mappings
    const sourceMap = new Map(dbSources.map((s) => [s.adapterType, s.id]));
    const fallbackSourceId = dbSources[0]?.id || 'default-source';

    let savedCount = 0;

    for (const group of finalTopGroups) {
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
          sourceType: ev.sourceType,
          sourceUrl: ev.sourceUrl,
          externalId: ev.externalId,
          hash: ev.hash,
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
        developerRelevanceScore: group.developerRelevanceScore,
        velocityScore: group.velocityScore,
        noveltyScore: group.noveltyScore,
        sourceAuthorityScore: group.sourceAuthorityScore,
        crossSourceScore: group.crossSourceScore,
        technicalDepthScore: group.technicalDepthScore,
        contentPotentialScore: group.contentPotentialScore,
        confidence: group.confidence,
        whatChanged: group.whatChanged,
        recommendedAngle: group.recommendedAngle,
        scoreReason: group.scoreReason,
        freshnessScore: group.freshnessScore,
        engagementScore: group.engagementScore,
        credibilityScore: group.credibilityScore,
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

