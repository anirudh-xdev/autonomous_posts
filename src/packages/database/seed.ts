import { prisma } from './client';
import { logger } from '../config';

const INITIAL_TOPICS = [
  { name: 'AI Agents', slug: 'ai-agents', category: 'agents', weight: 1.2 },
  { name: 'LLMs', slug: 'llms', category: 'models', weight: 1.0 },
  { name: 'AI Coding Agents', slug: 'ai-coding-agents', category: 'agents', weight: 1.3 },
  { name: 'Coding Assistants', slug: 'coding-assistants', category: 'tooling', weight: 1.1 },
  { name: 'Model Context Protocol (MCP)', slug: 'mcp', category: 'protocols', weight: 1.3 },
  { name: 'RAG', slug: 'rag', category: 'architecture', weight: 1.1 },
  { name: 'Vector Databases', slug: 'vector-databases', category: 'infra', weight: 1.0 },
  { name: 'AI Infrastructure', slug: 'ai-infrastructure', category: 'infra', weight: 1.1 },
  { name: 'AI Developer Tools', slug: 'ai-developer-tools', category: 'tooling', weight: 1.2 },
  { name: 'Open-Source AI', slug: 'open-source-ai', category: 'models', weight: 1.2 },
  { name: 'Open-Weight Models', slug: 'open-weight-models', category: 'models', weight: 1.2 },
  { name: 'Model Releases', slug: 'model-releases', category: 'models', weight: 1.1 },
  { name: 'Multimodal AI', slug: 'multimodal-ai', category: 'models', weight: 1.0 },
  { name: 'AI APIs', slug: 'ai-apis', category: 'infra', weight: 1.0 },
  { name: 'AI SDKs', slug: 'ai-sdks', category: 'tooling', weight: 1.1 },
  { name: 'AI Startups', slug: 'ai-startups', category: 'ecosystem', weight: 0.9 },
  { name: 'Developer Productivity', slug: 'developer-productivity', category: 'workflow', weight: 1.1 },
  { name: 'AI Engineering', slug: 'ai-engineering', category: 'engineering', weight: 1.3 },
  { name: 'AI Security', slug: 'ai-security', category: 'security', weight: 1.1 },
  { name: 'AI Observability', slug: 'ai-observability', category: 'infra', weight: 1.1 },
  { name: 'AI Deployment', slug: 'ai-deployment', category: 'infra', weight: 1.1 },
  { name: 'Inference', slug: 'inference', category: 'infra', weight: 1.2 },
  { name: 'GPUs / AI Hardware', slug: 'gpus-hardware', category: 'hardware', weight: 1.0 },
  { name: 'Agent Architectures', slug: 'agent-architectures', category: 'agents', weight: 1.3 },
  { name: 'Local LLMs', slug: 'local-llms', category: 'models', weight: 1.2 },
  { name: 'AI Frameworks', slug: 'ai-frameworks', category: 'tooling', weight: 1.1 },
];

const INITIAL_SOURCES = [
  {
    name: 'Hacker News AI',
    adapterType: 'hackernews',
    config: JSON.stringify({ minScore: 30, maxItems: 30 }),
  },
  {
    name: 'GitHub Trending AI',
    adapterType: 'github',
    config: JSON.stringify({ languages: ['Python', 'TypeScript'], since: 'daily' }),
  },
  {
    name: 'Reddit AI Discussions',
    adapterType: 'reddit',
    config: JSON.stringify({ subreddits: ['MachineLearning', 'LocalLLaMA', 'artificial'], minScore: 50 }),
  },
  {
    name: 'Tech & AI Lab RSS Feeds',
    adapterType: 'rss',
    config: JSON.stringify({
      feeds: [
        'https://openai.com/news/rss.xml',
        'https://techcrunch.com/category/artificial-intelligence/feed/',
        'https://arstechnica.com/tag/ai/feed/',
      ],
    }),
  },
  {
    name: 'Live Web AI Search',
    adapterType: 'websearch',
    config: JSON.stringify({ queries: ['new AI model release developer', 'AI coding agent benchmark', 'open source LLM release'] }),
  },
  {
    name: 'Social & X Tech Signals',
    adapterType: 'social',
    config: JSON.stringify({ keywords: ['#AIEngineering', 'LLM benchmark', 'coding agent'] }),
  },
  {
    name: 'Top AI Engineer Profiles',
    adapterType: 'engineers',
    config: JSON.stringify({
      profiles: ['Simon Willison', 'Andrej Karpathy', 'Swyx', 'Harrison Chase', 'Jim Fan'],
    }),
  },
];

export async function seedDatabase() {
  logger.info('🌱 Starting database seeding...');

  // 1. Seed Topics
  for (const topic of INITIAL_TOPICS) {
    await prisma.trendTopic.upsert({
      where: { slug: topic.slug },
      update: { weight: topic.weight, category: topic.category, enabled: true },
      create: topic,
    });
  }
  logger.info(`✅ Seeded ${INITIAL_TOPICS.length} trend topics`);

  // 2. Seed Sources
  for (const source of INITIAL_SOURCES) {
    await prisma.trendSource.upsert({
      where: { name: source.name },
      update: { adapterType: source.adapterType, config: source.config, enabled: true },
      create: source,
    });
  }
  logger.info(`✅ Seeded ${INITIAL_SOURCES.length} trend sources`);

  // 3. Seed Default Voice Profile
  const defaultProfile = {
    name: 'Default Technical Voice',
    tone: JSON.stringify(['technical', 'practical', 'conversational', 'confident but not exaggerated']),
    audience: JSON.stringify(['software developers', 'ai engineers', 'engineering leaders', 'technical founders']),
    technicalDepth: 7,
    humorLevel: 2,
    emojiLevel: 1,
    preferredStructure: JSON.stringify([
      'Hook',
      'What Changed',
      'Why Developers Care',
      'Technical Deep Dive',
      'Developer Impact',
      'Discussion Question',
    ]),
    avoidPhrases: JSON.stringify([
      'This changes everything',
      'The future is here',
      'Game changer',
      'Revolutionary',
      'Mind blown',
      'Crazy new AI',
      'Insane breakthrough',
    ]),
    preferredTopics: JSON.stringify(['AI agents', 'MCP', 'LLMs', 'Inference', 'AI coding agents', 'Local LLMs']),
    isDefault: true,
  };

  const existingVoice = await prisma.voiceProfile.findFirst({ where: { isDefault: true } });
  if (!existingVoice) {
    await prisma.voiceProfile.create({ data: defaultProfile });
  }
  logger.info('✅ Seeded default Voice Profile');

  // 4. Seed System Settings
  const settings = [
    { key: 'publishingMode', value: JSON.stringify('APPROVAL_REQUIRED') },
    { key: 'minTrendScore', value: JSON.stringify(70) },
    { key: 'minQualityScore', value: JSON.stringify(85) },
    { key: 'maxPostsPerDay', value: JSON.stringify(2) },
    {
      key: 'sensitiveExclusions',
      value: JSON.stringify([
        'politic',
        'election',
        'breaking conflict',
        'allegation',
        'accusation',
        'medical',
        'investment recommendation',
        'crypto',
        'legal claim',
      ]),
    },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  logger.info('✅ Seeded system settings & sensitive exclusions');
  logger.info('✨ Database seeding completed successfully.');
}

// Allow direct execution
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .catch((err) => {
      logger.error('Database seeding failed', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
