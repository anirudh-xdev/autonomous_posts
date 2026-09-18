import crypto from 'crypto';
import { NormalizedSignal } from '../types';

export class SignalDeduper {
  /**
   * Layer 2: Canonical URL sanitization
   * Strips tracking query params (utm_*, fbclid, gclid, ref, etc.) and normalizes structure.
   */
  public static canonicalizeUrl(rawUrl: string): string {
    if (!rawUrl) return '';
    try {
      const parsed = new URL(rawUrl.trim());
      // Strip common analytics & tracking parameters
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'utm_id',
        'fbclid',
        'gclid',
        'ref',
        'source',
        'spm',
        'feature',
        'share',
      ];

      for (const param of trackingParams) {
        parsed.searchParams.delete(param);
      }

      // Normalize protocol & hostname to lowercase
      parsed.protocol = parsed.protocol.toLowerCase();
      parsed.hostname = parsed.hostname.toLowerCase();

      // Normalize pathname: remove trailing slash unless root
      let pathname = parsed.pathname;
      if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }
      parsed.pathname = pathname;

      return parsed.toString();
    } catch {
      // Fallback for non-standard or relative URLs
      return rawUrl.trim().toLowerCase().replace(/\/+$/, '');
    }
  }

  /**
   * Generates deterministic SHA-256 idempotency hash for a signal
   */
  public static generateSignalHash(canonicalUrl: string, title: string): string {
    const cleanTitle = title.trim().toLowerCase().replace(/\s+/g, ' ');
    return crypto
      .createHash('sha256')
      .update(`${canonicalUrl}|${cleanTitle}`)
      .digest('hex');
  }

  /**
   * Layer 3: Title Normalization & Tokenization
   */
  public static tokenize(text: string): Set<string> {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'for',
      'to', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after',
      'this', 'that', 'these', 'those', 'are', 'was', 'were', 'be', 'been',
      'how', 'why', 'what', 'who', 'when', 'new', 'now', 'top', 'best',
    ]);

    const clean = text
      .toLowerCase()
      .replace(/[^\w\s\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const tokens = clean.split(' ').filter((t) => t.length > 2 && !stopWords.has(t));
    return new Set(tokens);
  }

  /**
   * Token Jaccard Similarity index (0 to 1)
   */
  public static jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  /**
   * Levenshtein Distance for title similarity
   */
  public static levenshteinDistance(s1: string, s2: string): number {
    const a = s1.toLowerCase().trim();
    const b = s2.toLowerCase().trim();
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Checks if two titles represent the same event / announcement
   */
  public static isTitleSimilar(titleA: string, titleB: string, threshold = 0.75): boolean {
    const cleanA = titleA.toLowerCase().trim();
    const cleanB = titleB.toLowerCase().trim();

    if (cleanA === cleanB) return true;

    // Token Jaccard
    const tokensA = this.tokenize(cleanA);
    const tokensB = this.tokenize(cleanB);
    const jaccard = this.jaccardSimilarity(tokensA, tokensB);
    if (jaccard >= threshold) return true;

    // Token subset containment check (e.g. base title contained within extended title)
    const [smaller, larger] = tokensA.size <= tokensB.size ? [tokensA, tokensB] : [tokensB, tokensA];
    if (smaller.size >= 3) {
      let subsetMatches = 0;
      for (const t of smaller) {
        if (larger.has(t)) subsetMatches++;
      }
      if (subsetMatches / smaller.size >= 0.8) return true;
    }

    // Levenshtein similarity ratio
    const maxLen = Math.max(cleanA.length, cleanB.length);
    if (maxLen === 0) return true;
    const distance = this.levenshteinDistance(cleanA, cleanB);
    const ratio = 1 - distance / maxLen;

    return ratio >= threshold;
  }

  /**
   * Multi-layer deduplication of raw signals into unique candidates
   */
  public static deduplicateSignals(signals: NormalizedSignal[]): NormalizedSignal[] {
    const seenHashes = new Set<string>();
    const seenUrls = new Set<string>();
    const uniqueSignals: NormalizedSignal[] = [];

    for (const sig of signals) {
      // Layer 1 & 2: URL check
      const canonicalUrl = this.canonicalizeUrl(sig.url);
      if (seenUrls.has(canonicalUrl)) {
        continue;
      }

      // Hash check
      const hash = sig.hash || this.generateSignalHash(canonicalUrl, sig.title);
      if (seenHashes.has(hash)) {
        continue;
      }

      // Layer 3: Title similarity check against already accepted unique signals
      let isDuplicateTitle = false;
      for (const accepted of uniqueSignals) {
        if (this.isTitleSimilar(sig.title, accepted.title, 0.8)) {
          isDuplicateTitle = true;
          break;
        }
      }

      if (!isDuplicateTitle) {
        seenUrls.add(canonicalUrl);
        seenHashes.add(hash);
        uniqueSignals.push({
          ...sig,
          canonicalUrl,
          hash,
        });
      }
    }

    return uniqueSignals;
  }
}
