import { DeterministicCheckResult } from '../types';

export class PlatformValidator {
  public static validateLinkedIn(text: string): DeterministicCheckResult {
    const violations: string[] = [];

    if (text.length < 250) {
      violations.push(`LinkedIn post too short (${text.length} chars). Minimum recommended is 250 characters.`);
    }
    if (text.length > 2500) {
      violations.push(`LinkedIn post exceeds maximum limit (${text.length} chars). Maximum is 2500 characters.`);
    }

    // Check for hashtag stuffing
    const hashtags = text.match(/#\w+/g) || [];
    if (hashtags.length > 4) {
      violations.push(`Too many hashtags (${hashtags.length}). Recommended limit is 0-3 relevant hashtags.`);
    }

    // Check paragraph formatting (whitespace)
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    if (paragraphs.length < 3 && text.length > 350) {
      violations.push('Wall of text detected. Use short paragraphs separated by blank lines for readability.');
    }

    return {
      passed: violations.length === 0,
      violations,
      spamScore: hashtags.length > 4 ? 20 : 0,
    };
  }

  public static validateX(text: string, isThread = false, posts?: string[]): DeterministicCheckResult {
    const violations: string[] = [];

    if (text.length > 280) {
      violations.push(`Single X post exceeds 280 characters (${text.length} chars).`);
    }

    if (isThread) {
      if (!posts || posts.length < 2) {
        violations.push('Thread mode enabled but fewer than 2 posts provided.');
      } else {
        posts.forEach((p, idx) => {
          if (p.length > 280) {
            violations.push(`Thread tweet #${idx + 1} exceeds 280 characters (${p.length} chars).`);
          }
        });
      }
    }

    const hashtags = text.match(/#\w+/g) || [];
    if (hashtags.length > 3) {
      violations.push(`Too many hashtags on X (${hashtags.length}). Keep to 0-2.`);
    }

    return {
      passed: violations.length === 0,
      violations,
      spamScore: hashtags.length > 3 ? 25 : 0,
    };
  }
}
