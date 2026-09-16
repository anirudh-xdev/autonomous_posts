export type QueueName =
  | 'discovery-queue'
  | 'research-queue'
  | 'content-queue'
  | 'quality-queue'
  | 'publishing-queue'
  | 'analytics-queue';

export type JobName =
  | 'discover-trends'
  | 'research-trend'
  | 'generate-content'
  | 'quality-check'
  | 'publish-post'
  | 'collect-analytics';

export interface DiscoverTrendsJobPayload {
  limitPerSource?: number;
  timeframeHours?: number;
}

export interface ResearchTrendJobPayload {
  trendId: string;
  forceRefresh?: boolean;
}

export interface GenerateContentJobPayload {
  trendId: string;
  customAngle?: string;
}

export interface QualityCheckJobPayload {
  variantId: string;
}

export interface PublishPostJobPayload {
  variantId: string;
  platform: 'LINKEDIN' | 'X';
  scheduledTime?: string;
}

export interface CollectAnalyticsJobPayload {
  publicationId: string;
}

export interface JobOptions {
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  delay?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}
