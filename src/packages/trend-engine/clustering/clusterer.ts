import { TrendCandidate, CanonicalTrendGroup, SourceType } from '../types';
import { TrendNormalizer } from './normalizer';
import { SignalDeduper } from '../deduplication/signal-deduper';
import { trendScorer } from '../scoring/scorer';

export class TrendClusterer {
  private similarityThreshold: number;

  constructor(similarityThreshold = 0.25) {
    this.similarityThreshold = similarityThreshold;
  }

  /**
   * Calculates velocity score (0-10) based on mention acceleration across time windows
   */
  private calculateVelocity(evidences: Array<{ publishedAt?: Date }>): number {
    const now = Date.now();
    const sixHoursAgo = now - 6 * 3600 * 1000;
    const twelveHoursAgo = now - 12 * 3600 * 1000;
    const twentyFourHoursAgo = now - 24 * 3600 * 1000;

    let count6h = 0;
    let count12h = 0;
    let count24h = 0;

    for (const ev of evidences) {
      if (ev.publishedAt) {
        const time = new Date(ev.publishedAt).getTime();
        if (time >= sixHoursAgo) count6h++;
        if (time >= twelveHoursAgo) count12h++;
        if (time >= twentyFourHoursAgo) count24h++;
      } else {
        // Assume recent if publishedAt is undefined
        count6h++;
        count12h++;
        count24h++;
      }
    }

    // High velocity when mentions accelerate in the 6h window
    if (count6h >= 3) return 9.5;
    if (count6h >= 2) return 9.0;
    if (count12h >= 3) return 8.5;
    if (count24h >= 3) return 8.0;
    if (count24h >= 1) return 7.5;
    return 7.0;
  }

  /**
   * Calculates cross-source confirmation score (0-10) based on independent tiers
   */
  private calculateCrossSourceScore(sourceTypes: SourceType[]): number {
    const uniqueTiers = new Set(sourceTypes);
    const count = uniqueTiers.size;

    // Scale from 5.0 (single source type) to 10.0 (3+ independent tiers)
    if (count >= 4) return 10.0;
    if (count === 3) return 9.2;
    if (count === 2) return 8.2;
    return 6.5;
  }

  /**
   * Computes source authority score from evidence source types
   */
  private calculateSourceAuthority(sourceTypes: SourceType[]): number {
    if (sourceTypes.length === 0) return 8.0;
    let total = 0;
    for (const type of sourceTypes) {
      if (type === 'PRIMARY') total += 10.0;
      else if (type === 'RESEARCH') total += 9.2;
      else if (type === 'DEVELOPER') total += 8.8;
      else if (type === 'NEWS') total += 8.2;
      else total += 7.5; // COMMUNITY
    }
    return Math.round((total / sourceTypes.length) * 10) / 10;
  }

  /**
   * Clusters a flat list of TrendCandidates into CanonicalTrendGroups
   */
  public cluster(candidates: TrendCandidate[]): CanonicalTrendGroup[] {
    const groups: Array<{
      canonicalCandidate: TrendCandidate;
      tokens: Set<string>;
      evidences: Array<{
        sourceName: string;
        sourceType: SourceType;
        sourceUrl: string;
        rawTitle: string;
        snippet?: string;
        author?: string;
        rawScore?: number;
        publishedAt?: Date;
        externalId?: string;
        hash?: string;
      }>;
      mergedTopics: Set<string>;
      maxDevRelevance: number;
      maxNovelty: number;
      maxTechnicalDepth: number;
      maxContentPotential: number;
    }> = [];

    for (const candidate of candidates) {
      const canonicalUrl = SignalDeduper.canonicalizeUrl(candidate.sourceUrl);
      const cleanTitle = TrendNormalizer.normalizeTitle(candidate.title);
      const tokens = SignalDeduper.tokenize(`${cleanTitle} ${candidate.summary}`);
      const hash = candidate.hash || SignalDeduper.generateSignalHash(canonicalUrl, cleanTitle);

      const sourceType: SourceType = candidate.sourceType || 'DEVELOPER';

      // Check if candidate matches an existing group
      let matchedGroupIndex = -1;
      let highestSimilarity = 0;

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        // 1. Direct URL match check
        const hasUrlMatch = group.evidences.some((ev) => ev.sourceUrl === canonicalUrl);
        if (hasUrlMatch) {
          matchedGroupIndex = i;
          break;
        }

        // 2. Token Jaccard similarity check
        const sim = SignalDeduper.jaccardSimilarity(tokens, group.tokens);
        if (sim >= this.similarityThreshold && sim > highestSimilarity) {
          highestSimilarity = sim;
          matchedGroupIndex = i;
        }
      }

      const evidenceItem = {
        sourceName: candidate.sourceName,
        sourceType,
        sourceUrl: canonicalUrl,
        rawTitle: candidate.title,
        snippet: candidate.summary,
        author: candidate.author,
        rawScore: candidate.rawScore,
        publishedAt: candidate.publishedAt,
        externalId: candidate.externalId,
        hash,
      };

      if (matchedGroupIndex >= 0) {
        // Merge into existing group
        const group = groups[matchedGroupIndex];
        group.evidences.push(evidenceItem);
        for (const t of tokens) group.tokens.add(t);
        for (const top of candidate.topics) group.mergedTopics.add(top);

        group.maxDevRelevance = Math.max(group.maxDevRelevance, candidate.developerRelevanceScore || 7.0);
        group.maxNovelty = Math.max(group.maxNovelty, candidate.noveltyScore || 7.0);
        group.maxTechnicalDepth = Math.max(
          group.maxTechnicalDepth,
          candidate.technicalDepthScore || candidate.developerRelevanceScore || 7.5
        );
        group.maxContentPotential = Math.max(group.maxContentPotential, candidate.contentPotentialScore || 8.0);

        // Keep canonical title as the more formal/comprehensive one
        if (cleanTitle.length > group.canonicalCandidate.title.length && !cleanTitle.includes('...')) {
          group.canonicalCandidate.title = cleanTitle;
          group.canonicalCandidate.summary = candidate.summary;
        }
      } else {
        // Create new group
        groups.push({
          canonicalCandidate: { ...candidate, title: cleanTitle },
          tokens,
          evidences: [evidenceItem],
          mergedTopics: new Set(candidate.topics),
          maxDevRelevance: candidate.developerRelevanceScore || 7.0,
          maxNovelty: candidate.noveltyScore || 7.0,
          maxTechnicalDepth: candidate.technicalDepthScore || candidate.developerRelevanceScore || 7.5,
          maxContentPotential: candidate.contentPotentialScore || 8.0,
        });
      }
    }

    // Convert groups into CanonicalTrendGroup array with recalculated 7-factor transparent scores
    return groups.map((g) => {
      const topics = Array.from(g.mergedTopics);
      const slug = TrendNormalizer.slugify(g.canonicalCandidate.title);

      const sourceTypes = g.evidences.map((e) => e.sourceType);
      const uniqueTiers = Array.from(new Set(sourceTypes));
      const velocityScore = this.calculateVelocity(g.evidences);
      const crossSourceScore = this.calculateCrossSourceScore(sourceTypes);
      const sourceAuthorityScore = this.calculateSourceAuthority(sourceTypes);

      const scored = trendScorer.scoreCandidate(
        {
          ...g.canonicalCandidate,
          topics,
          developerRelevanceScore: g.maxDevRelevance,
          velocityScore,
          noveltyScore: g.maxNovelty,
          sourceAuthorityScore,
          crossSourceScore,
          technicalDepthScore: g.maxTechnicalDepth,
          contentPotentialScore: g.maxContentPotential,
          freshnessScore: velocityScore,
          engagementScore: Math.min(10, 6.0 + g.evidences.length * 0.8),
          credibilityScore: sourceAuthorityScore,
          totalScore: 0,
        },
        g.evidences.length,
        uniqueTiers.length
      );

      return {
        canonicalTitle: g.canonicalCandidate.title,
        slug,
        summary: g.canonicalCandidate.summary,
        topics,
        score: scored.totalScore,
        developerRelevanceScore: scored.developerRelevanceScore,
        velocityScore: scored.velocityScore || velocityScore,
        noveltyScore: scored.noveltyScore,
        sourceAuthorityScore: scored.sourceAuthorityScore || sourceAuthorityScore,
        crossSourceScore: scored.crossSourceScore || crossSourceScore,
        technicalDepthScore: scored.technicalDepthScore || g.maxTechnicalDepth,
        contentPotentialScore: scored.contentPotentialScore || g.maxContentPotential,
        confidence: g.canonicalCandidate.confidence || 88,
        whatChanged: g.canonicalCandidate.whatChanged,
        recommendedAngle: g.canonicalCandidate.recommendedAngle,
        // Backward compatibility
        freshnessScore: scored.freshnessScore,
        engagementScore: scored.engagementScore,
        credibilityScore: scored.credibilityScore,
        scoreReason: scored.scoreReason || 'Consensus detected across developer channels.',
        independentSourceTypes: uniqueTiers,
        evidences: g.evidences,
      };
    });
  }
}

export const trendClusterer = new TrendClusterer();

