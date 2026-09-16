export interface TrendCandidate {
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  publishedAt?: Date;
  rawScore?: number;
  author?: string;
  topics: string[];
  freshnessScore: number;         // 0 - 10
  engagementScore: number;        // 0 - 10
  developerRelevanceScore: number;// 0 - 10
  noveltyScore: number;           // 0 - 10
  credibilityScore: number;       // 0 - 10
  totalScore: number;             // 0 - 100
  scoreReason?: string;
}

export interface DiscoveryOptions {
  limitPerSource?: number;
  timeframeHours?: number;
  topicsFilter?: string[];
}

export interface TrendSource {
  readonly name: string;
  readonly adapterType: string;
  discover(options?: DiscoveryOptions): Promise<TrendCandidate[]>;
  healthCheck(): Promise<boolean>;
}

export interface ScoringWeights {
  freshness: number;         // default 0.20
  developerRelevance: number;// default 0.25
  engagement: number;        // default 0.20
  novelty: number;           // default 0.15
  credibility: number;       // default 0.20
}

export interface CanonicalTrendGroup {
  canonicalTitle: string;
  slug: string;
  summary: string;
  topics: string[];
  score: number;
  freshnessScore: number;
  developerRelevanceScore: number;
  engagementScore: number;
  noveltyScore: number;
  credibilityScore: number;
  scoreReason: string;
  evidences: Array<{
    sourceName: string;
    sourceUrl: string;
    rawTitle: string;
    snippet?: string;
    author?: string;
    rawScore?: number;
    publishedAt?: Date;
  }>;
}
