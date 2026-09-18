import { logger } from '@/packages/config';

export class SourceReader {
  /**
   * Fetches URL content safely with timeout and sanitizes into rich technical text.
   * Automatically handles GitHub repositories (fetching raw README.md) and ArXiv papers.
   */
  public static async fetchContent(url: string, timeoutMs = 7000): Promise<string> {
    try {
      // 1. Specialized GitHub Repository Handler
      const githubMatch = url.match(/^https?:\/\/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)(?:\/.*)?$/);
      if (githubMatch) {
        const owner = githubMatch[1];
        const repo = githubMatch[2].replace(/\.git$/, '');
        const readme = await this.fetchGitHubReadme(owner, repo, timeoutMs);
        if (readme) {
          logger.info(`SourceReader: successfully fetched raw README.md for ${owner}/${repo} (${readme.length} chars)`);
          return readme;
        }
      }

      // 2. Specialized ArXiv Paper Handler
      const arxivMatch = url.match(/^https?:\/\/arxiv\.org\/(?:abs|pdf)\/([0-9]+\.[0-9]+)(?:v[0-9]+)?$/);
      if (arxivMatch) {
        const arxivId = arxivMatch[1];
        const arxivData = await this.fetchArxivPaper(arxivId, timeoutMs);
        if (arxivData) {
          logger.info(`SourceReader: successfully fetched ArXiv paper metadata for ${arxivId}`);
          return arxivData;
        }
      }

      // 3. General Web Article Scraper
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'AutonomusPosts-ResearchAgent/1.0 (Developer Content Verification; +https://github.com)',
          Accept: 'text/html,application/xhtml+xml,text/plain,application/xml',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        logger.warn(`SourceReader: HTTP ${res.status} when fetching ${url}`);
        return '';
      }

      const text = await res.text();

      // If it's markdown or plain text, return directly
      if (url.endsWith('.md') || url.endsWith('.txt')) {
        return text.slice(0, 8000);
      }

      return this.cleanHtml(text);
    } catch (err) {
      logger.debug(`SourceReader: could not fetch ${url}`, { error: String(err) });
      return '';
    }
  }

  /**
   * Fetches the raw README.md of a GitHub repository directly from raw.githubusercontent.com
   */
  private static async fetchGitHubReadme(owner: string, repo: string, timeoutMs: number): Promise<string> {
    const branches = ['main', 'master'];
    for (const branch of branches) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
        const res = await fetch(rawUrl, {
          headers: { 'User-Agent': 'AutonomusPosts-ResearchAgent/1.0' },
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (res.ok) {
          const md = await res.text();
          if (md.trim().length > 100) {
            return `### GitHub Repository README: ${owner}/${repo}\n\n${md.slice(0, 8000)}`;
          }
        }
      } catch {
        // Try next branch
      }
    }
    return '';
  }

  /**
   * Fetches official ArXiv paper metadata and abstract from the ArXiv API
   */
  private static async fetchArxivPaper(arxivId: string, timeoutMs: number): Promise<string> {
    try {
      const apiUrl = `http://export.arxiv.org/api/query?id_list=${arxivId}`;
      const res = await fetch(apiUrl, {
        headers: { 'User-Agent': 'AutonomusPosts-ResearchAgent/1.0' },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) {
        const xml = await res.text();
        const titleMatch = xml.match(/<title>([\s\S]*?)<\/title>/gi);
        // Second title tag is usually the entry title
        const entryTitle = titleMatch && titleMatch.length > 1 ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        const summaryMatch = xml.match(/<summary>([\s\S]*?)<\/summary>/i);
        const summary = summaryMatch ? summaryMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        if (summary) {
          return `### ArXiv Scientific Paper [${arxivId}]: ${entryTitle}\n\n**Abstract & Findings:**\n${summary}`;
        }
      }
    } catch (err) {
      logger.debug(`SourceReader: ArXiv API lookup failed for ${arxivId}`, { error: String(err) });
    }
    return '';
  }

  /**
   * Strips scripts, styles, and tags, returning clean text paragraphs prioritizing article content
   */
  public static cleanHtml(html: string): string {
    // If <article> or <main> is present, prioritize its content
    const articleMatch = html.match(/<(?:article|main)[^>]*>([\s\S]*?)<\/(?:article|main)>/i);
    const contentToClean = articleMatch ? articleMatch[1] : html;

    return contentToClean
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000); // Preserve up to 8000 chars of deep article text
  }
}
