import { LLMProvider, LLMRequest, LLMResponse, StructuredLLMRequest, StructuredLLMResponse } from '../types';
import { logger } from '@/packages/config';

export class MockLLMProvider implements LLMProvider {
  public readonly name = 'mock';
  private defaultModel = 'mock-llm-v1';

  async generateText(input: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    logger.debug('MockLLMProvider: generateText called', { messagesCount: input.messages.length });

    const userMessage = input.messages.find((m) => m.role === 'user')?.content || '';
    const text = `[Mock Response] Analysis of: ${userMessage.slice(0, 100)}...`;

    return {
      text,
      tokensUsed: { promptTokens: 50, completionTokens: 80, totalTokens: 130 },
      latencyMs: Date.now() - startTime,
      model: input.model || this.defaultModel,
      provider: this.name,
    };
  }

  async generateStructured<T>(input: StructuredLLMRequest<T>): Promise<StructuredLLMResponse<T>> {
    const startTime = Date.now();
    logger.debug('MockLLMProvider: generateStructured called', { schemaName: input.schemaName });

    const userMsg = input.messages.find((m) => m.role === 'user')?.content || '';
    let mockData: unknown;

    if (input.schemaName.includes('Research') || input.schemaName.includes('research')) {
      mockData = {
        keyFacts: [
          'Anthropic introduced Model Context Protocol (MCP) as an open standard protocol.',
          'MCP enables LLM assistants to discover and access local and remote development tools.',
          'Architecture uses client-host-server JSON-RPC pattern over stdio or SSE.',
        ],
        whatChanged:
          'Instead of custom ad-hoc tool definitions per LLM ecosystem, MCP establishes a standardized JSON-RPC interface for tool discovery and execution.',
        whyItMatters:
          'Reduces integration friction across developer tools and eliminates vendor lock-in for AI agent extensions.',
        developerImpact:
          'Engineers can write an MCP server once (e.g. for PostgreSQL, GitHub, Docker) and use it across Claude Desktop, Cursor, and custom agent runtimes.',
        uncertainties: [
          'Enterprise authentication mechanisms over distributed servers are still evolving.',
          'Latency overhead for multi-hop tool chaining requires production benchmarking.',
        ],
        sources: [
          { title: 'Anthropic Engineering Blog', url: 'https://www.anthropic.com/news/model-context-protocol', credibility: 9.8 },
          { title: 'Official GitHub Specification', url: 'https://github.com/modelcontextprotocol/specification', credibility: 9.9 },
        ],
        confidence: 96,
      };
    } else if (input.schemaName.includes('Content') || input.schemaName.includes('content') || input.schemaName.includes('generation')) {
      mockData = {
        linkedin: {
          hook: "AI tooling is shifting from proprietary plugins to open protocols.",
          text: `AI tooling is shifting from proprietary plugins to open protocols.\n\nEvery AI lab previously built their own incompatible tool-calling formats. You wrote one connector for OpenAI functions, another for Anthropic tool use, and another for LangChain.\n\nWhat changed?\nAnthropic's Model Context Protocol (MCP) defines a standardized, client-host-server protocol over JSON-RPC. Think of it as the Language Server Protocol (LSP), but for AI agent tools.\n\nWhy developers should care:\n1. Write once, run everywhere: One server connects your database or CLI to any supporting IDE.\n2. Security boundary: Tools run in isolated processes with explicit user consent prompts.\n3. Ecosystem velocity: SDKs are already available in TypeScript and Python.\n\nPractical insight:\nIf you are designing internal developer agents, stop inventing custom REST adapters for your internal APIs. Wrap them as lightweight MCP servers instead.\n\nHave you tried integrating MCP into your local agent workflow yet? What's your experience been?`,
        },
        x: {
          hook: "MCP is quietly becoming the Language Server Protocol for AI agents.",
          text: "Why Anthropic's Model Context Protocol (MCP) matters for developers:\n\nStop writing custom tool glue for every LLM. MCP provides a universal JSON-RPC protocol to connect agents to databases, git, and local APIs.\n\nWrite once. Run across Cursor, Claude, and custom agents.",
          isThread: true,
          posts: [
            "1/ MCP (Model Context Protocol) is quietly becoming the Language Server Protocol for AI agents.\n\nHere is why engineers should pay attention to this architectural shift 🧵",
            "2/ The problem: Every AI framework had its own bespoke tool schemas.\n\nIf you built a PostgreSQL tool for LangChain, it didn't work out-of-the-box with Cursor or Claude Desktop. The glue code was multiplying exponentially.",
            "3/ What changed: MCP standardizes discovery, prompts, and tool execution over JSON-RPC (stdio/SSE).\n\nYour agent host negotiates capabilities with independent tool servers. Clean process isolation.",
            "4/ Developer takeaway: Stop writing proprietary tool adapters. If you build internal developer tooling, build an MCP server. It instantly makes your tools accessible to any modern coding assistant.",
            "5/ What tools would you want your IDE agent to have first-class access to? Database schemas? CI/CD logs? Docker containers?",
          ],
        },
        reasoning: {
          angle: "Architectural parallel to LSP (Language Server Protocol)",
          developerInsight: "Decoupling tool servers from LLM client implementations prevents vendor lock-in.",
        },
      };
    } else if (input.schemaName.includes('Quality') || input.schemaName.includes('quality')) {
      mockData = {
        factualAccuracy: 96,
        originality: 92,
        developerValue: 94,
        writingQuality: 95,
        sourceConfidence: 95,
        spamScore: 2,
        overallScore: 94,
        passed: true,
        feedback: [
          'High technical substance and concrete developer takeaway.',
          'Strong whitespace and readable paragraph structure.',
          'Zero banned buzzwords or exaggerated claims detected.',
        ],
        checks: {
          claimsSupportedBySources: true,
          noBannedBuzzwords: true,
          withinCharacterLimits: true,
          noExcessiveEmojis: true,
          noExcessiveHashtags: true,
        },
      };
    } else {
      mockData = { result: `Mock structured data for ${userMsg.slice(0, 50)}` };
    }

    const validated = input.schema.parse(mockData);

    return {
      data: validated,
      rawText: JSON.stringify(mockData, null, 2),
      tokensUsed: { promptTokens: 120, completionTokens: 350, totalTokens: 470 },
      latencyMs: Date.now() - startTime,
      model: input.model || this.defaultModel,
      provider: this.name,
    };
  }
}
