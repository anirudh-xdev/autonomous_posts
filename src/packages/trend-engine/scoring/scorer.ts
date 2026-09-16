import { ScoringWeights, TrendCandidate } from '../types';

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  freshness: 0.20,
  developerRelevance: 0.25,
  engagement: 0.20,
  novelty: 0.15,
  credibility: 0.20,
};

export class TrendScorer {
  private weights: ScoringWeights;

  constructor(customWeights: Partial<ScoringWeights> = {}) {
    this.weights = { ...DEFAULT_SCORING_WEIGHTS, ...customWeights };
  }

  /**
   * Calculates transparent 0-100 total score from 0-10 dimension scores
   */
  public calculateScore(candidate: {
    freshnessScore: number;
    developerRelevanceScore: number;
    engagementScore: number;
    noveltyScore: number;
    credibilityScore: number;
  }): number {
    const rawWeighted =
      candidate.freshnessScore * this.weights.freshness +
      candidate.developerRelevanceScore * this.weights.developerRelevance +
      candidate.engagementScore * this.weights.engagement +
      candidate.noveltyScore * this.weights.novelty +
      candidate.credibilityScore * this.weights.credibility;

    // Normalize 0-10 range to 0-100
    const normalized = Math.round(rawWeighted * 10 * 10) / 10;
    return Math.min(100, Math.max(0, normalized));
  }

  /**
   * Generates a transparent, human-readable reason for why the trend achieved its score
   */
  public generateScoreReason(candidate: {
    freshnessScore: number;
    developerRelevanceScore: number;
    engagementScore: number;
    noveltyScore: number;
    credibilityScore: number;
    totalScore: number;
    evidenceCount?: number;
  }): string {
    const reasons: string[] = [];

    if (candidate.developerRelevanceScore >= 8.5) {
      reasons.push('High practical impact on developer workflows, tooling, and architectures');
    } else if (candidate.developerRelevanceScore >= 6.5) {
      reasons.push('Moderate developer applicability across software engineering teams');
    }

    if (candidate.credibilityScore >= 8.5) {
      reasons.push('Corroborated by verified primary sources or peer engineering benchmarks');
    }

    if (candidate.engagementScore >= 8.0) {
      reasons.push('Surging technical discussions across engineer communities');
    }

    if (candidate.freshnessScore >= 8.0) {
      reasons.push('Breaking within the last 24-48 hours');
    }

    if (candidate.evidenceCount && candidate.evidenceCount > 1) {
      reasons.push(`Merged across ${candidate.evidenceCount} independent sources`);
    }

    return reasons.length > 0 ? reasons.join('; ') + '.' : 'Standard baseline technology activity.';
  }

  public scoreCandidate(candidate: TrendCandidate, evidenceCount = 1): TrendCandidate {
    const totalScore = this.calculateScore(candidate);
    const scoreReason = this.generateScoreReason({
      ...candidate,
      totalScore,
      evidenceCount,
    });

    return {
      ...candidate,
      totalScore,
      scoreReason,
    };
  }
}

export const trendScorer = new TrendScorer();
