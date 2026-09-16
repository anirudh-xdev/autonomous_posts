import { TrendCandidate, CanonicalTrendGroup } from '../types';
import { TrendNormalizer } from './normalizer';
import { trendScorer } from '../scoring/scorer';

export class TrendClusterer {
  private similarityThreshold: number;

  constructor(similarityThreshold = 0.25) {
    this.similarityThreshold = similarityThreshold;
  }

  /**
   * Computes Jaccard similarity index between two sets of tokens
   */
  private jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0;

    let intersectionSize = 0;
    for (const item of setA) {
      if (setB.has(item)) {
        intersectionSize++;
      }
    }

    const unionSize = setA.size + setB.size - intersectionSize;
    return unionSize === 0 ? 0 : intersectionSize / unionSize;
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
        sourceUrl: string;
        rawTitle: string;
        snippet?: string;
        author?: string;
        rawScore?: number;
        publishedAt?: Date;
      }>;
      mergedTopics: Set<string>;
      maxFreshness: number;
      maxDevRelevance: number;
      avgEngagement: number;
      maxNovelty: number;
      maxCredibility: number;
    }> = [];

    for (const candidate of candidates) {
      const canonicalUrl = TrendNormalizer.canonicalizeUrl(candidate.sourceUrl);
      const cleanTitle = TrendNormalizer.normalizeTitle(candidate.title);
      const tokens = TrendNormalizer.tokenize(`${cleanTitle} ${candidate.summary}`);

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
        const sim = this.jaccardSimilarity(tokens, group.tokens);
        if (sim >= this.similarityThreshold && sim > highestSimilarity) {
          highestSimilarity = sim;
          matchedGroupIndex = i;
        }
      }

      const evidenceItem = {
        sourceName: candidate.sourceName,
        sourceUrl: canonicalUrl,
        rawTitle: candidate.title,
        snippet: candidate.summary,
        author: candidate.author,
        rawScore: candidate.rawScore,
        publishedAt: candidate.publishedAt,
      };

      if (matchedGroupIndex >= 0) {
        // Merge into existing group
        const group = groups[matchedGroupIndex];
        group.evidences.push(evidenceItem);
        for (const t of tokens) group.tokens.add(t);
        for (const top of candidate.topics) group.mergedTopics.add(top);

        // Enhance scores when multiple credible sources report the same event
        group.maxFreshness = Math.max(group.maxFreshness, candidate.freshnessScore);
        group.maxDevRelevance = Math.max(group.maxDevRelevance, candidate.developerRelevanceScore);
        group.maxNovelty = Math.max(group.maxNovelty, candidate.noveltyScore);
        // Boost credibility and engagement with multi-source consensus
        group.maxCredibility = Math.min(10, Math.max(group.maxCredibility, candidate.credibilityScore) + 0.3);
        group.avgEngagement = Math.min(10, group.avgEngagement + 0.5);

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
          maxFreshness: candidate.freshnessScore,
          maxDevRelevance: candidate.developerRelevanceScore,
          avgEngagement: candidate.engagementScore,
          maxNovelty: candidate.noveltyScore,
          maxCredibility: candidate.credibilityScore,
        });
      }
    }

    // Convert groups into CanonicalTrendGroup array with recalculated transparent scores
    return groups.map((g) => {
      const topics = Array.from(g.mergedTopics);
      const slug = TrendNormalizer.slugify(g.canonicalCandidate.title);

      const scored = trendScorer.scoreCandidate(
        {
          ...g.canonicalCandidate,
          topics,
          freshnessScore: g.maxFreshness,
          developerRelevanceScore: g.maxDevRelevance,
          engagementScore: g.avgEngagement,
          noveltyScore: g.maxNovelty,
          credibilityScore: g.maxCredibility,
          totalScore: 0,
        },
        g.evidences.length
      );

      return {
        canonicalTitle: g.canonicalCandidate.title,
        slug,
        summary: g.canonicalCandidate.summary,
        topics,
        score: scored.totalScore,
        freshnessScore: scored.freshnessScore,
        developerRelevanceScore: scored.developerRelevanceScore,
        engagementScore: scored.engagementScore,
        noveltyScore: scored.noveltyScore,
        credibilityScore: scored.credibilityScore,
        scoreReason: scored.scoreReason || 'Consensus detected across developer channels.',
        evidences: g.evidences,
      };
    });
  }
}

export const trendClusterer = new TrendClusterer();
