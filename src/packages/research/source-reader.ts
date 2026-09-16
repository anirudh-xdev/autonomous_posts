import { logger } from '@/packages/config';

export class SourceReader {
  /**
   * Fetches URL content safely with timeout and sanitizes HTML into plain markdown-like text
   */
  public static async fetchContent(url: string, timeoutMs = 5000): Promise<string> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'AutonomusPosts-ResearchAgent/1.0 (Developer Content Verification)',
          Accept: 'text/html,application/xhtml+xml,text/plain',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        logger.warn(`SourceReader: HTTP ${res.status} when fetching ${url}`);
        return '';
      }

      const html = await res.text();
      return this.cleanHtml(html);
    } catch (err) {
      logger.debug(`SourceReader: could not fetch ${url}`, { error: String(err) });
      return '';
    }
  }

  /**
   * Strips scripts, styles, and tags, returning clean text paragraphs
   */
  public static cleanHtml(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000); // Keep max 4000 chars of relevant body text
  }
}
