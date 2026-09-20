import { prisma } from '@/packages/database';
import { logger } from '@/packages/config';

export class SafetyService {
  private static DEFAULT_SENSITIVE_TOPICS = [
    'politic',
    'election',
    'breaking conflict',
    'allegation',
    'accusation',
    'medical claim',
    'cure',
    'crypto',
    'investment recommendation',
    'financial advice',
    'lawsuit',
    'legal claim',
  ];

  /**
   * Builds an exact word-boundary regex for a sensitive keyword or phrase,
   * preventing false-positive substring matches (e.g. "selection" matching "election",
   * "secure" matching "cure", "procure" matching "cure").
   */
  public static getKeywordPattern(keyword: string): RegExp {
    const lower = keyword.toLowerCase().trim();
    if (lower === 'election' || lower === 'elections') {
      return /\b(elections?|electoral)\b/i;
    }
    if (lower === 'politic' || lower === 'politics' || lower === 'political') {
      return /\b(polit(ic|ics|ical|ician|icians))\b/i;
    }
    if (lower === 'cure' || lower === 'cures') {
      return /\b(cures?|curative)\b/i;
    }
    if (lower === 'medical') {
      return /\b(medical\s+(claim|advice|diagnosis|cure|emergency))\b/i;
    }
    if (lower === 'crypto') {
      return /\b(cryptocurrency|crypto\s+(coin|coins|tokens?|trading|wallet|investing|market|scam|pump))\b/i;
    }
    // Escape regex special characters for phrases like "breaking conflict", "financial advice"
    const escaped = lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i');
  }

  /**
   * Scans text and trend topics for sensitive or dangerous content
   */
  public static async evaluateSafety(
    text: string,
    topics: string[] = []
  ): Promise<{
    safe: boolean;
    reason?: string;
    flaggedKeywords: string[];
  }> {
    // Load custom exclusions from system settings if present
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'sensitiveExclusions' } });
    const exclusions: string[] = setting ? JSON.parse(setting.value) : this.DEFAULT_SENSITIVE_TOPICS;

    const flaggedKeywords: string[] = [];

    for (const excl of exclusions) {
      const pattern = this.getKeywordPattern(excl);
      if (pattern.test(text) || topics.some((t) => pattern.test(t))) {
        flaggedKeywords.push(excl);
      }
    }

    if (flaggedKeywords.length > 0) {
      const reason = `Content contains restricted sensitive topic(s): ${flaggedKeywords.join(', ')}. Automatic publishing blocked; manual review required.`;
      logger.warn('SafetyService: sensitive topic detected', { flaggedKeywords, reason });
      return { safe: false, reason, flaggedKeywords };
    }

    return { safe: true, flaggedKeywords: [] };
  }
}
