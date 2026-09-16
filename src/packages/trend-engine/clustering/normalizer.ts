export class TrendNormalizer {
  private static STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'it', 'its', 'from', 'as', 'that', 'this', 'these', 'those',
  ]);

  private static TOPIC_KEYWORDS: Record<string, string[]> = {
    'mcp': ['model context protocol', 'mcp', 'mcp server'],
    'ai-coding-agents': ['coding agent', 'coding assistants', 'cursor', 'copilot', 'devin', 'cline', 'aider'],
    'ai-agents': ['ai agent', 'autonomous agent', 'multi-agent', 'agentic'],
    'llms': ['llm', 'large language model', 'language models', 'foundation model'],
    'rag': ['rag', 'retrieval-augmented', 'retrieval augmented generation', 'vector search'],
    'vector-databases': ['vector database', 'chroma', 'pinecone', 'milvus', 'qdrant', 'pgvector'],
    'open-weight-models': ['open weight', 'open-source ai', 'llama', 'mistral', 'deepseek', 'qwen'],
    'inference': ['inference', 'vllm', 'ollama', 'tgi', 'speculative decoding', 'groq'],
    'ai-infrastructure': ['gpu', 'cuda', 'h100', 'b200', 'cluster', 'ai infra'],
    'ai-observability': ['evals', 'llm evals', 'observability', 'langfuse', 'braintrust'],
  };

  /**
   * Cleans URLs by removing tracking query parameters and canonicalizing structure
   */
  public static canonicalizeUrl(rawUrl: string): string {
    try {
      const url = new URL(rawUrl);
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'ref',
        'fbclid',
        'gclid',
        'source',
        'mc_cid',
      ];

      for (const param of trackingParams) {
        url.searchParams.delete(param);
      }

      // Strip hash
      url.hash = '';

      // Normalize trailing slash
      let clean = url.toString();
      if (clean.endsWith('/') && url.pathname !== '/') {
        clean = clean.slice(0, -1);
      }
      return clean;
    } catch {
      return rawUrl.trim();
    }
  }

  /**
   * Normalizes titles by stripping platform markers and non-semantic punctuation
   */
  public static normalizeTitle(rawTitle: string): string {
    return rawTitle
      .replace(/^\[(?:Show HN|Ask HN|Tell HN|D|P|R|News|Discussion)\]\s*/i, '')
      .replace(/^(?:Show HN|Ask HN):\s*/i, '')
      .replace(/\s*\(GitHub\s+Repo\)$/i, '')
      .replace(/\s*\|\s*TechCrunch$/i, '')
      .replace(/\s*\|\s*Ars Technica$/i, '')
      .replace(/\s*-\s*The Verge$/i, '')
      .trim();
  }

  /**
   * Generates URL-friendly slug
   */
  public static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80)
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Tokenizes text into normalized unique keywords (stripping stop words)
   */
  public static tokenize(text: string): Set<string> {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !this.STOP_WORDS.has(w));

    return new Set(words);
  }

  /**
   * Detects relevant topics based on title and summary content
   */
  public static extractTopics(title: string, summary: string): string[] {
    const combined = `${title} ${summary}`.toLowerCase();
    const matchedTopics: string[] = [];

    for (const [topicSlug, keywords] of Object.entries(this.TOPIC_KEYWORDS)) {
      if (keywords.some((kw) => combined.includes(kw))) {
        matchedTopics.push(topicSlug);
      }
    }

    // Default to 'llms' or 'ai-engineering' if nothing specific matched
    if (matchedTopics.length === 0) {
      matchedTopics.push('ai-engineering');
    }

    return matchedTopics;
  }
}
