import { ScoringWeights, TrendCandidate, SevenFactorScores } from '../types';

export const DEFAULT_SEVEN_FACTOR_WEIGHTS: ScoringWeights = {
  developerRelevance: 0.25,
  velocity: 0.20,
  novelty: 0.15,
  sourceAuthority: 0.15,
  crossSource: 0.10,
  technicalDepth: 0.10,
  contentPotential: 0.05,
};

export class TrendScorer {
  private weights: ScoringWeights;

  constructor(customWeights: Partial<ScoringWeights> = {}) {
    this.weights = { ...DEFAULT_SEVEN_FACTOR_WEIGHTS, ...customWeights };
  }

  /**
   * Calculates transparent 0-100 total score from the 7 dimension scores (each 0-10)
   * Formula:
   * score = (dev_relevance * 0.25 + velocity * 0.20 + novelty * 0.15 + source_authority * 0.15 +
   *          cross_source * 0.10 + technical_depth * 0.10 + content_potential * 0.05) * 10
   */
  public calculateScore(factors: {
    developerRelevance: number;
    velocity: number;
    novelty: number;
    sourceAuthority: number;
    crossSource: number;
    technicalDepth: number;
    contentPotential: number;
  }): number {
    const rawWeighted =
      factors.developerRelevance * this.weights.developerRelevance +
      factors.velocity * this.weights.velocity +
      factors.novelty * this.weights.novelty +
      factors.sourceAuthority * this.weights.sourceAuthority +
      factors.crossSource * this.weights.crossSource +
      factors.technicalDepth * this.weights.technicalDepth +
      factors.contentPotential * this.weights.contentPotential;

    // Scale from 0-10 to 0-100 and round to 1 decimal place
    const normalized = Math.round(rawWeighted * 10 * 10) / 10;
    return Math.min(100, Math.max(0, normalized));
  }

  /**
   * Generates a transparent human-readable explanation of why the trend achieved its score
   */
  public generateScoreReason(factors: {
    developerRelevance: number;
    velocity: number;
    novelty: number;
    sourceAuthority: number;
    crossSource: number;
    technicalDepth: number;
    contentPotential: number;
    totalScore: number;
    evidenceCount?: number;
    independentTierCount?: number;
  }): string {
    const reasons: string[] = [];

    if (factors.developerRelevance >= 8.5) {
      reasons.push('High practical impact on developer workflows & code architectures');
    } else if (factors.developerRelevance >= 7.0) {
      reasons.push('Direct relevance to AI engineers & software developers');
    }

    if (factors.velocity >= 8.0) {
      reasons.push('Rapidly accelerating attention within the last 6-12 hours');
    }

    if (factors.sourceAuthority >= 9.0) {
      reasons.push('Verified by top primary AI research labs or frontier engineering teams');
    } else if (factors.sourceAuthority >= 8.0) {
      reasons.push('Backed by authoritative engineering publications & repositories');
    }

    if (factors.independentTierCount && factors.independentTierCount >= 3) {
      reasons.push(`Corroborated across ${factors.independentTierCount} independent source tiers`);
    } else if (factors.crossSource >= 7.5) {
      reasons.push('Multi-source cross confirmation established');
    }

    if (factors.technicalDepth >= 8.0) {
      reasons.push('Substantial technical depth with concrete implementation implications');
    }

    return reasons.length > 0 ? reasons.join('; ') + '.' : 'Emerging baseline technology signal.';
  }

  public scoreCandidate(
    candidate: TrendCandidate,
    evidenceCount = 1,
    independentTierCount = 1
  ): TrendCandidate {
    const devRel = candidate.developerRelevanceScore ?? 7.0;
    const velocity = candidate.velocityScore ?? candidate.freshnessScore ?? 7.0;
    const novelty = candidate.noveltyScore ?? 7.0;
    const sourceAuthority = candidate.sourceAuthorityScore ?? candidate.credibilityScore ?? 8.0;
    const crossSource = candidate.crossSourceScore ?? Math.min(10, 5 + independentTierCount * 1.5);
    const techDepth = candidate.technicalDepthScore ?? candidate.developerRelevanceScore ?? 7.5;
    const contentPot = candidate.contentPotentialScore ?? 8.0;

    const totalScore = this.calculateScore({
      developerRelevance: devRel,
      velocity,
      novelty,
      sourceAuthority,
      crossSource,
      technicalDepth: techDepth,
      contentPotential: contentPot,
    });

    const scoreReason = this.generateScoreReason({
      developerRelevance: devRel,
      velocity,
      novelty,
      sourceAuthority,
      crossSource,
      technicalDepth: techDepth,
      contentPotential: contentPot,
      totalScore,
      evidenceCount,
      independentTierCount,
    });

    return {
      ...candidate,
      developerRelevanceScore: devRel,
      velocityScore: velocity,
      noveltyScore: novelty,
      sourceAuthorityScore: sourceAuthority,
      crossSourceScore: crossSource,
      technicalDepthScore: techDepth,
      contentPotentialScore: contentPot,
      // Backward compatibility
      freshnessScore: velocity,
      engagementScore: candidate.engagementScore ?? 7.0,
      credibilityScore: sourceAuthority,
      totalScore,
      scoreReason,
    };
  }
}

export const trendScorer = new TrendScorer();

