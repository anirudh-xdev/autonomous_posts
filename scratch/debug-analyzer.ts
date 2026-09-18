import { aiTrendAnalyzer } from '@/packages/trend-engine/analyzer/ai-trend-analyzer';
import { PromptManager, LLMProviderFactory } from '@/packages/ai';

async function test() {
  console.log('Testing PromptManager and LLMProviderFactory...');
  try {
    const template = PromptManager.getPrompt('trend-analyzer.v1');
    console.log('Template loaded successfully:', template.version);

    const provider = LLMProviderFactory.getDefault();
    console.log('Provider name:', provider.name, 'model:', provider.modelName);

    const testCluster = {
      canonicalTitle: 'OpenAI Releases Operator: Autonomous Agent for Desktop Tasks',
      slug: 'openai-releases-operator',
      summary: 'OpenAI has announced Operator, an agent that can execute multi-step computer tasks.',
      topics: ['ai-agents', 'developer-tools'],
      score: 92,
      developerRelevanceScore: 9.5,
      velocityScore: 9.0,
      noveltyScore: 9.0,
      sourceAuthorityScore: 10.0,
      crossSourceScore: 9.0,
      technicalDepthScore: 9.0,
      contentPotentialScore: 9.0,
      confidence: 90,
      freshnessScore: 9.0,
      engagementScore: 9.0,
      credibilityScore: 10.0,
      scoreReason: 'Primary release from OpenAI',
      independentSourceTypes: ['PRIMARY' as const, 'DEVELOPER' as const],
      evidences: [
        {
          sourceName: 'OpenAI News',
          sourceType: 'PRIMARY' as const,
          sourceUrl: 'https://openai.com/news/operator',
          rawTitle: 'Introducing Operator',
          snippet: 'Operator uses visual and browser grounding to execute computer tasks on behalf of users.',
        },
      ],
    };

    const res = await aiTrendAnalyzer.analyzeCluster(testCluster);
    console.log('Analysis result:', res);
  } catch (err) {
    console.error('Test failed with error:', err);
  }
}

test();
