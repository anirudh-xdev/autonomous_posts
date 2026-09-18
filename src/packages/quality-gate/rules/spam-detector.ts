import { DeterministicCheckResult } from '../types';

export class SpamDetector {
  private static BANNED_BUZZWORDS = [
    'this changes everything',
    'the future is here',
    'game changer',
    'game-changer',
    'revolutionary',
    'mind blown',
    'mind-blowing',
    'crazy new ai',
    'insane new ai',
    'unbelievable tool',
    'you wont believe',
    'you won\'t believe',
    'dont miss this',
    'don\'t miss this',
    'act fast',
    'drop a comment below for the link',
    'shifts the paradigm',
    'paradigm shift',
    'declarative model-driven',
    'declarative, model-driven',
    'deterministic privacy-preserving',
    'supercharge',
    'unleash',
    'delve',
    'testament to',
    'spearheading',
    'groundbreaking',
  ];

  /**
   * Scans text for clickbait buzzwords, excessive emojis, and spammy repetition
   */
  public static analyze(text: string, customAvoidPhrases: string[] = []): DeterministicCheckResult {
    const lower = text.toLowerCase();
    const violations: string[] = [];
    let spamScore = 0;

    // 1. Check banned buzzwords
    const allBanned = [...this.BANNED_BUZZWORDS, ...customAvoidPhrases.map((p) => p.toLowerCase())];
    for (const phrase of allBanned) {
      if (lower.includes(phrase)) {
        violations.push(`Detected prohibited buzzword/phrase: "${phrase}".`);
        spamScore += 30;
      }
    }

    // 2. Count emojis
    // Match emoji unicode regex
    const emojiRegex = /[\p{Extended_Pictographic}]/gu;
    const emojis = text.match(emojiRegex) || [];
    if (emojis.length > 3) {
      violations.push(`Excessive emojis detected (${emojis.length}). Maximum recommended is 1-2.`);
      spamScore += Math.min(40, (emojis.length - 3) * 10);
    }

    // 3. Repeated exclamation marks or ALL CAPS
    if (/!{2,}/.test(text)) {
      violations.push('Multiple consecutive exclamation marks detected (e.g. "!!").');
      spamScore += 20;
    }

    const words = text.split(/\s+/);
    const capsWords = words.filter((w) => w.length > 3 && w === w.toUpperCase() && /^[A-Z]+$/.test(w));
    if (capsWords.length > 3) {
      violations.push(`Excessive ALL-CAPS words (${capsWords.join(', ')}). Maintain professional developer tone.`);
      spamScore += 25;
    }

    return {
      passed: violations.length === 0,
      violations,
      spamScore: Math.min(100, spamScore),
    };
  }
}
