import { PrismaClient } from '@prisma/client';
import { logger } from '@/packages/config';

export interface TopicDefinition {
  name: string;
  slug: string;
  category: string;
  keywords: string[];
  relatedKeywords: string[];
  weight: number;
  priority: number;
}

export const INITIAL_TOPICS: TopicDefinition[] = [
  {
    name: 'AI Agents',
    slug: 'ai-agents',
    category: 'agents',
    keywords: ['agent', 'autonomous', 'multi-agent', 'agentic', 'tool calling', 'subagent', 'agent loop'],
    relatedKeywords: ['agent harness', 'computer use', 'agent memory', 'agent skills', 'context engineering'],
    weight: 1.2,
    priority: 1,
  },
  {
    name: 'AI Coding',
    slug: 'ai-coding',
    category: 'tooling',
    keywords: ['coding agent', 'cursor', 'copilot', 'devin', 'cline', 'code generation', 'repository workflow'],
    relatedKeywords: ['code repair', 'spec-driven development', 'test generation', 'syntax validation'],
    weight: 1.2,
    priority: 1,
  },
  {
    name: 'LLMs',
    slug: 'llms',
    category: 'models',
    keywords: ['llm', 'large language model', 'gpt', 'claude', 'gemini', 'deepseek', 'llama', 'reasoning model'],
    relatedKeywords: ['test-time compute', 'cot reasoning', 'context window', 'system prompts'],
    weight: 1.0,
    priority: 1,
  },
  {
    name: 'MCP',
    slug: 'mcp',
    category: 'tooling',
    keywords: ['mcp', 'model context protocol', 'mcp server', 'mcp client', 'anthropic protocol'],
    relatedKeywords: ['stdio transport', 'sse transport', 'tool resource', 'agent protocol'],
    weight: 1.25,
    priority: 1,
  },
  {
    name: 'RAG',
    slug: 'rag',
    category: 'infra',
    keywords: ['rag', 'retrieval-augmented generation', 'vector database', 'embeddings', 'chunking', 'reranking'],
    relatedKeywords: ['hybrid search', 'graphrag', 'colbert', 'late interaction', 'bm25 rerank'],
    weight: 1.0,
    priority: 2,
  },
  {
    name: 'AI Infrastructure',
    slug: 'ai-infrastructure',
    category: 'infra',
    keywords: ['gpu cluster', 'cuda', 'triton', 'h100', 'b200', 'tensor parallel', 'pipeline parallel'],
    relatedKeywords: ['nccl', 'interconnect', 'vllm cluster', 'flashattention', 'kernel optimization'],
    weight: 1.1,
    priority: 2,
  },
  {
    name: 'AI APIs',
    slug: 'ai-apis',
    category: 'tooling',
    keywords: ['openai api', 'anthropic api', 'openrouter', 'groq api', 'bedrock', 'vertex ai'],
    relatedKeywords: ['structured outputs', 'json mode', 'batch api', 'rate limits', 'prompt caching'],
    weight: 1.0,
    priority: 2,
  },
  {
    name: 'AI SDKs',
    slug: 'ai-sdks',
    category: 'tooling',
    keywords: ['ai sdk', 'vercel ai sdk', 'langchain', 'llamaindex', 'instructor', 'outlines'],
    relatedKeywords: ['streaming protocol', 'type-safe prompts', 'tool definitions', 'zod schema'],
    weight: 1.0,
    priority: 2,
  },
  {
    name: 'Open Source AI',
    slug: 'open-source-ai',
    category: 'models',
    keywords: ['open weights', 'open source ai', 'hugging face', 'ollama', 'vllm', 'llama.cpp', 'mistral'],
    relatedKeywords: ['apache 2.0', 'weights license', 'self-hosting', 'quantization', 'gguf'],
    weight: 1.15,
    priority: 1,
  },
  {
    name: 'AI Models',
    slug: 'ai-models',
    category: 'models',
    keywords: ['frontier model', 'foundation model', 'multimodal model', 'mixture of experts', 'moe', 'transformer'],
    relatedKeywords: ['dense model', 'active parameters', 'expert routing', 'synthetic pretraining'],
    weight: 1.0,
    priority: 2,
  },
  {
    name: 'Multimodal AI',
    slug: 'multimodal-ai',
    category: 'models',
    keywords: ['multimodal', 'vision language', 'audio generation', 'video generation', 'omni model', 'speech-to-text'],
    relatedKeywords: ['image understanding', 'cross-modal embeddings', 'spatial tokens', 'frame extraction'],
    weight: 1.0,
    priority: 2,
  },
  {
    name: 'AI Security',
    slug: 'ai-security',
    category: 'tooling',
    keywords: ['prompt injection', 'jailbreak', 'llm security', 'guardrails', 'adversarial attack', 'data exfiltration'],
    relatedKeywords: ['indirect prompt injection', 'canary tokens', 'input sanitization', 'model auditing'],
    weight: 1.1,
    priority: 2,
  },
  {
    name: 'AI Inference',
    slug: 'ai-inference',
    category: 'infra',
    keywords: ['inference speed', 'tok/s', 'latency', 'speculative decoding', 'kv cache', 'quantization', 'fp8', 'int4'],
    relatedKeywords: ['continuous batching', 'paged attention', 'tensorrt-llm', 'awq', 'gptq'],
    weight: 1.15,
    priority: 1,
  },
  {
    name: 'AI Developer Tools',
    slug: 'ai-developer-tools',
    category: 'tooling',
    keywords: ['eval framework', 'prompt management', 'synthetic data', 'playground', 'benchmarking suite'],
    relatedKeywords: ['deepeval', 'ragas', 'promptfoo', 'langfuse', 'braintrust'],
    weight: 1.1,
    priority: 1,
  },
  {
    name: 'AI Startups',
    slug: 'ai-startups',
    category: 'general',
    keywords: ['ai startup', 'y combinator ai', 'seed round', 'series a', 'founder', 'product market fit'],
    relatedKeywords: ['ai moat', 'wrapper vs platform', 'pricing models', 'enterprise sales'],
    weight: 0.9,
    priority: 3,
  },
  {
    name: 'AI Research',
    slug: 'ai-research',
    category: 'research',
    keywords: ['arxiv paper', 'neurips', 'icml', 'iclr', 'empirical study', 'scaling laws', 'benchmark evaluation'],
    relatedKeywords: ['loss curves', 'data mixture', 'synthetic data scaling', 'rlhf alignment'],
    weight: 1.1,
    priority: 2,
  },
  {
    name: 'Developer Productivity',
    slug: 'developer-productivity',
    category: 'tooling',
    keywords: ['developer velocity', 'pull request automation', 'code review bot', 'terminal assistant', 'cli ai'],
    relatedKeywords: ['flow state', 'developer onboarding', 'documentation generation', 'issue triage'],
    weight: 1.0,
    priority: 2,
  },
  {
    name: 'AI Automation',
    slug: 'ai-automation',
    category: 'agents',
    keywords: ['workflow automation', 'headless browser agent', 'event-driven pipeline', 'webhook agent', 'activepieces'],
    relatedKeywords: ['scheduled triggers', 'idempotent jobs', 'human-in-the-loop', 'state machines'],
    weight: 1.0,
    priority: 2,
  },
  {
    name: 'AI Observability',
    slug: 'ai-observability',
    category: 'infra',
    keywords: ['llm tracing', 'token usage tracking', 'opentelemetry ai', 'cost analytics', 'latency breakdown'],
    relatedKeywords: ['langsmith', 'arize phoenix', 'helicone', 'trace spans', 'cache hit rates'],
    weight: 1.0,
    priority: 3,
  },
  {
    name: 'Local LLMs',
    slug: 'local-llms',
    category: 'models',
    keywords: ['local llm', 'ollama', 'llama.cpp', 'mac m-series inference', 'exllamav2', 'on-device ai'],
    relatedKeywords: ['vram requirements', 'unified memory', 'metal acceleration', 'air-gapped deployment'],
    weight: 1.1,
    priority: 2,
  },
];

export class TopicRegistry {
  /**
   * Seed all 20 initial topics into database with full keyword sets
   */
  public static async seedDefaults(prisma: PrismaClient): Promise<number> {
    let seeded = 0;
    for (const def of INITIAL_TOPICS) {
      const existing = await prisma.trendTopic.findUnique({
        where: { slug: def.slug },
      });

      if (!existing) {
        await prisma.trendTopic.create({
          data: {
            name: def.name,
            slug: def.slug,
            category: def.category,
            keywords: JSON.stringify(def.keywords),
            relatedKeywords: JSON.stringify(def.relatedKeywords),
            weight: def.weight,
            priority: def.priority,
            enabled: true,
          },
        });
        seeded++;
      } else {
        await prisma.trendTopic.update({
          where: { id: existing.id },
          data: {
            keywords: JSON.stringify(def.keywords),
            relatedKeywords: JSON.stringify(def.relatedKeywords),
            weight: def.weight,
            priority: def.priority,
          },
        });
      }
    }

    if (seeded > 0) {
      logger.info(`TopicRegistry: seeded ${seeded} initial topics into database`);
    }

    return seeded;
  }

  /**
   * Dynamic Keyword Discovery:
   * Analyzes signals and discovered trends to propose emerging terminology.
   */
  public static async discoverEmergingKeywords(
    prisma: PrismaClient,
    candidateTexts: string[]
  ): Promise<{ topicSlug: string; discoveredTerm: string; count: number }[]> {
    const topics = await prisma.trendTopic.findMany({ where: { enabled: true } });
    const discovered: { topicSlug: string; discoveredTerm: string; count: number }[] = [];

    // Technical n-gram patterns often seen in emerging trends
    const technicalPatterns = [
      /\b([a-z0-9\-]+ (?:engineering|architecture|harness|protocol|framework|serving|quantization|synthesis|evals|agent))\b/gi,
      /\b([a-z0-9\-]+ (?:cache|kv|routing|memory|distillation|checkpoint|adapter))\b/gi,
    ];

    const termFrequency = new Map<string, number>();

    for (const text of candidateTexts) {
      for (const pattern of technicalPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          for (const match of matches) {
            const clean = match.toLowerCase().trim();
            if (clean.length > 5 && !clean.includes('http') && !clean.includes('www')) {
              termFrequency.set(clean, (termFrequency.get(clean) || 0) + 1);
            }
          }
        }
      }
    }

    // Filter terms with count >= 2 and match with closest topic
    for (const [term, count] of termFrequency.entries()) {
      if (count >= 2) {
        for (const topic of topics) {
          const existingKeywords: string[] = JSON.parse(topic.keywords || '[]');
          const existingRelated: string[] = JSON.parse(topic.relatedKeywords || '[]');

          if (existingKeywords.includes(term) || existingRelated.includes(term)) {
            continue;
          }

          // Check if term shares root with topic keywords
          const hasAffinity = existingKeywords.some((kw) => term.includes(kw) || kw.includes(term.split(' ')[0]));
          if (hasAffinity) {
            existingRelated.push(term);
            await prisma.trendTopic.update({
              where: { id: topic.id },
              data: { relatedKeywords: JSON.stringify(Array.from(new Set(existingRelated))) },
            });
            discovered.push({ topicSlug: topic.slug, discoveredTerm: term, count });
            logger.info(`DynamicKeywordDiscovery: associated emerging term "${term}" with topic "${topic.name}"`);
            break;
          }
        }
      }
    }

    return discovered;
  }
}
