import { SourceType, CollectionMethod } from '../types';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/packages/config';

export interface SourceDefinition {
  name: string;
  type: SourceType;
  adapterType: string;
  url?: string;
  apiUrl?: string;
  collectionMethod: CollectionMethod;
  trustScore: number;
  priority: number;
  refreshInterval: number; // minutes
  topics: string[];
}

/**
 * 5-Tier Source Hierarchy according to the Developer Trend Intelligence Blueprint
 */
export const DEFAULT_SOURCE_REGISTRY: SourceDefinition[] = [
  // --- TIER 1: PRIMARY SOURCES (Trust 10) ---
  {
    name: 'OpenAI Official Releases',
    type: 'PRIMARY',
    adapterType: 'rss',
    url: 'https://openai.com/news/rss.xml',
    collectionMethod: 'RSS',
    trustScore: 10.0,
    priority: 1,
    refreshInterval: 120,
    topics: ['models', 'apis', 'sdks', 'tooling'],
  },
  {
    name: 'Google DeepMind & AI Research',
    type: 'PRIMARY',
    adapterType: 'rss',
    url: 'https://deepmind.google/blog/rss.xml',
    collectionMethod: 'RSS',
    trustScore: 10.0,
    priority: 1,
    refreshInterval: 120,
    topics: ['models', 'research', 'reasoning'],
  },
  {
    name: 'Meta AI Engineering & Llama',
    type: 'PRIMARY',
    adapterType: 'rss',
    url: 'https://ai.meta.com/blog/rss/',
    collectionMethod: 'RSS',
    trustScore: 10.0,
    priority: 1,
    refreshInterval: 120,
    topics: ['open-source-ai', 'models', 'infrastructure'],
  },
  {
    name: 'Mistral AI Releases',
    type: 'PRIMARY',
    adapterType: 'rss',
    url: 'https://mistral.ai/news/index.xml',
    collectionMethod: 'RSS',
    trustScore: 10.0,
    priority: 1,
    refreshInterval: 180,
    topics: ['models', 'inference', 'open-source-ai'],
  },
  {
    name: 'Hugging Face Official Blog',
    type: 'PRIMARY',
    adapterType: 'rss',
    url: 'https://huggingface.co/blog/feed.xml',
    collectionMethod: 'RSS',
    trustScore: 9.8,
    priority: 1,
    refreshInterval: 180,
    topics: ['open-source-ai', 'models', 'transformers', 'tooling'],
  },
  {
    name: 'vLLM & Inference Infrastructure',
    type: 'PRIMARY',
    adapterType: 'rss',
    url: 'https://blog.vllm.ai/feed.xml',
    collectionMethod: 'RSS',
    trustScore: 9.5,
    priority: 1,
    refreshInterval: 240,
    topics: ['inference', 'infrastructure', 'open-source-ai'],
  },

  // --- TIER 2: RESEARCH SOURCES (Trust 9) ---
  {
    name: 'Hugging Face Daily Papers',
    type: 'RESEARCH',
    adapterType: 'rss',
    url: 'https://huggingface.co/papers/feed.xml',
    collectionMethod: 'RSS',
    trustScore: 9.2,
    priority: 2,
    refreshInterval: 180,
    topics: ['research', 'models', 'benchmarks'],
  },
  {
    name: 'ArXiv AI & Machine Learning Preprints',
    type: 'RESEARCH',
    adapterType: 'rss',
    url: 'https://rss.arxiv.org/rss/cs.AI',
    collectionMethod: 'RSS',
    trustScore: 9.0,
    priority: 2,
    refreshInterval: 240,
    topics: ['research', 'reasoning', 'architectures'],
  },
  {
    name: 'The Gradient Research Essays',
    type: 'RESEARCH',
    adapterType: 'rss',
    url: 'https://thegradient.pub/rss/',
    collectionMethod: 'RSS',
    trustScore: 8.8,
    priority: 2,
    refreshInterval: 360,
    topics: ['research', 'ai-future', 'architectures'],
  },

  // --- TIER 3: DEVELOPER SOURCES (Trust 8.5 - 9) ---
  {
    name: 'GitHub Trending & Surging AI Repositories',
    type: 'DEVELOPER',
    adapterType: 'github',
    apiUrl: 'https://api.github.com/search/repositories',
    collectionMethod: 'GITHUB_API',
    trustScore: 9.0,
    priority: 1,
    refreshInterval: 240,
    topics: ['tooling', 'agents', 'open-source-ai', 'infrastructure'],
  },
  {
    name: 'Hacker News Developer Discussion',
    type: 'DEVELOPER',
    adapterType: 'hackernews',
    apiUrl: 'https://hn.algolia.com/api/v1',
    collectionMethod: 'HN_API',
    trustScore: 8.8,
    priority: 1,
    refreshInterval: 120,
    topics: ['developer-productivity', 'tooling', 'startups', 'agents'],
  },
  {
    name: 'Top AI Engineer Practitioner Blogs',
    type: 'DEVELOPER',
    adapterType: 'engineers',
    collectionMethod: 'RSS',
    trustScore: 9.3,
    priority: 1,
    refreshInterval: 180,
    topics: ['ai-engineering', 'agents', 'mcp', 'evals', 'llms'],
  },

  // --- TIER 4: COMMUNITY SOURCES (Trust 7 - 8) ---
  {
    name: 'Reddit AI & LocalLLaMA Communities',
    type: 'COMMUNITY',
    adapterType: 'reddit',
    apiUrl: 'https://www.reddit.com/r/LocalLLaMA+MachineLearning/top.json',
    collectionMethod: 'REDDIT_API',
    trustScore: 7.5,
    priority: 3,
    refreshInterval: 240,
    topics: ['local-llms', 'quantization', 'hardware', 'fine-tuning'],
  },
  {
    name: 'Social & Technical Developer Signals',
    type: 'COMMUNITY',
    adapterType: 'social',
    collectionMethod: 'HTTP_API',
    trustScore: 7.2,
    priority: 3,
    refreshInterval: 180,
    topics: ['discussions', 'velocity', 'adoption'],
  },

  // --- TIER 5: NEWS SOURCES (Trust 8 - 8.5) ---
  {
    name: 'Ars Technica AI & Technology Lab',
    type: 'NEWS',
    adapterType: 'rss',
    url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
    collectionMethod: 'RSS',
    trustScore: 8.5,
    priority: 2,
    refreshInterval: 240,
    topics: ['context', 'independent-reporting', 'security'],
  },
  {
    name: 'TechCrunch AI Analysis',
    type: 'NEWS',
    adapterType: 'rss',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    collectionMethod: 'RSS',
    trustScore: 8.2,
    priority: 2,
    refreshInterval: 240,
    topics: ['startups', 'funding', 'enterprise'],
  },
  {
    name: 'Live Web Multi-Angle AI Search',
    type: 'NEWS',
    adapterType: 'websearch',
    collectionMethod: 'WEB_SEARCH',
    trustScore: 8.0,
    priority: 1,
    refreshInterval: 120,
    topics: ['breaking', 'benchmarks', 'cross-checking'],
  },
];

export class SourceRegistry {
  /**
   * Automatically seeds database with the 5-tier source hierarchy if not present
   */
  public static async seedDefaults(prisma: PrismaClient): Promise<number> {
    let seeded = 0;
    for (const def of DEFAULT_SOURCE_REGISTRY) {
      const existing = await prisma.trendSource.findUnique({
        where: { name: def.name },
      });

      if (!existing) {
        await prisma.trendSource.create({
          data: {
            name: def.name,
            type: def.type,
            adapterType: def.adapterType,
            url: def.url || null,
            apiUrl: def.apiUrl || null,
            trustScore: def.trustScore,
            priority: def.priority,
            collectionMethod: def.collectionMethod,
            refreshInterval: def.refreshInterval,
            topics: JSON.stringify(def.topics),
            enabled: true,
          },
        });
        seeded++;
      } else {
        // Upgrade existing records with missing metadata
        await prisma.trendSource.update({
          where: { id: existing.id },
          data: {
            type: def.type,
            trustScore: def.trustScore,
            collectionMethod: def.collectionMethod,
            refreshInterval: def.refreshInterval,
            topics: JSON.stringify(def.topics),
          },
        });
      }
    }

    if (seeded > 0) {
      logger.info(`SourceRegistry: seeded ${seeded} sources into database`);
    }

    return seeded;
  }
}
