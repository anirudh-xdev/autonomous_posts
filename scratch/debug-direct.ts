import { PromptManager, LLMProviderFactory } from '@/packages/ai';
import { AITrendAnalysisSchema } from '@/packages/trend-engine/analyzer/ai-trend-analyzer';

async function test() {
  const template = PromptManager.getPrompt('trend-analyzer.v1');
  const provider = LLMProviderFactory.getDefault();

  const rendered = PromptManager.render(template, {
    title: 'OpenAI Releases Operator: Autonomous Agent for Desktop Tasks',
    summary: 'OpenAI has announced Operator, an agent that can execute multi-step computer tasks.',
    topics: 'ai-agents, developer-tools',
    evidences: 'Introducing Operator: an agent that uses visual grounding to execute computer tasks.',
  });

  try {
    const res = await provider.generateJSON(
      [
        { role: 'system', content: rendered.system },
        { role: 'user', content: rendered.user },
      ],
      AITrendAnalysisSchema,
      { temperature: 0.2, maxTokens: 1500 }
    );
    console.log('Success:', res);
  } catch (err: any) {
    console.error('Direct error:', err.message, err.stack);
  }
}

test();
