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

    const lowerText = text.toLowerCase();
    const flaggedKeywords: string[] = [];

    for (const excl of exclusions) {
      const kw = excl.toLowerCase();
      if (lowerText.includes(kw) || topics.some((t) => t.toLowerCase().includes(kw))) {
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
