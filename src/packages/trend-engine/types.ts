export type SourceType = 'PRIMARY' | 'RESEARCH' | 'DEVELOPER' | 'COMMUNITY' | 'NEWS';

export type CollectionMethod = 'RSS' | 'HTTP_API' | 'GITHUB_API' | 'HN_API' | 'REDDIT_API' | 'WEB_SEARCH';

export interface NormalizedSignal {
  id?: string;
  sourceId?: string;
  externalId: string;
  title: string;
  summary: string;
  url: string;
  canonicalUrl: string;
  source: string;
  sourceType: SourceType;
  sourceTrustScore: number;
  publishedAt?: Date;
  author?: string;
  engagement: {
    score?: number;
    comments?: number;
    stars?: number;
    upvotes?: number;
  };
  topics: string[];
  hash: string;
  rawData?: Record<string, any>;
}

export interface SevenFactorScores {
  developerRelevance: number; // 25% (0-10)
  velocity: number;           // 20% (0-10)
  novelty: number;            // 15% (0-10)
  sourceAuthority: number;    // 15% (0-10)
  crossSource: number;        // 10% (0-10)
  technicalDepth: number;     // 10% (0-10)
  contentPotential: number;   // 5% (0-10)
  totalScore: number;         // 0-100
  confidence: number;         // 0-100
}

export interface TrendCandidate {
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  sourceType?: SourceType;
  externalId?: string;
  hash?: string;
  publishedAt?: Date;
  rawScore?: number;
  author?: string;
  topics: string[];
  
  // 7-Factor Scoring Dimensions (0 - 10)
  developerRelevanceScore: number;
  velocityScore?: number;
  noveltyScore: number;
  sourceAuthorityScore?: number;
  crossSourceScore?: number;
  technicalDepthScore?: number;
  contentPotentialScore?: number;
  confidence?: number;
  whatChanged?: string;
  recommendedAngle?: string;
  
  // Legacy / 5-Factor Dimensions for backward compatibility
  freshnessScore: number;
  engagementScore: number;
  credibilityScore: number;
  
  totalScore: number;             // 0 - 100
  scoreReason?: string;
}

export interface DiscoveryOptions {
  limitPerSource?: number;
  timeframeHours?: number;
  topicsFilter?: string[];
  limit?: number;
  replaceUnsaved?: boolean;
}

export interface TrendSource {
  readonly name: string;
  readonly adapterType: string;
  readonly sourceType?: SourceType;
  readonly trustScore?: number;
  discover(options?: DiscoveryOptions): Promise<TrendCandidate[]>;
  healthCheck(): Promise<boolean>;
}

export interface ScoringWeights {
  developerRelevance: number; // 0.25
  velocity: number;           // 0.20
  novelty: number;            // 0.15
  sourceAuthority: number;    // 0.15
  crossSource: number;        // 0.10
  technicalDepth: number;     // 0.10
  contentPotential: number;   // 0.05
}

export interface CanonicalTrendGroup {
  canonicalTitle: string;
  slug: string;
  summary: string;
  topics: string[];
  score: number;
  
  // 7-Factor Scores
  developerRelevanceScore: number;
  velocityScore: number;
  noveltyScore: number;
  sourceAuthorityScore: number;
  crossSourceScore: number;
  technicalDepthScore: number;
  contentPotentialScore: number;
  confidence: number;
  whatChanged?: string;
  recommendedAngle?: string;
  confirmedFacts?: string[];
  uncertainClaims?: string[];
  
  // Backwards compatibility
  freshnessScore: number;
  engagementScore: number;
  credibilityScore: number;
  
  scoreReason: string;
  independentSourceTypes: SourceType[];
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
}
