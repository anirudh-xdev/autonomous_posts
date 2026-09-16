import { prisma } from '../client';

export interface RecordAgentRunInput {
  agentType: string;
  model: string;
  provider: string;
  promptVersion: string;
  inputData: unknown;
  outputData?: unknown;
  tokensUsed?: number;
  latencyMs?: number;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}

export class AgentRunRepository {
  async record(run: RecordAgentRunInput) {
    return prisma.agentRun.create({
      data: {
        agentType: run.agentType,
        model: run.model,
        provider: run.provider,
        promptVersion: run.promptVersion,
        inputData: JSON.stringify(run.inputData),
        outputData: run.outputData ? JSON.stringify(run.outputData) : null,
        tokensUsed: run.tokensUsed ?? 0,
        latencyMs: run.latencyMs ?? 0,
        status: run.status,
        error: run.error,
      },
    });
  }

  async listRecent(limit = 20) {
    return prisma.agentRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const agentRunRepository = new AgentRunRepository();
