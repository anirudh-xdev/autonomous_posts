import {
  SocialPublisher,
  PublishPostInput,
  PublishResult,
  ValidatePostInput,
  ValidationResult,
  AccountInfo,
} from './types';
import { logger } from '@/packages/config';

export class MockPublisher implements SocialPublisher {
  public readonly platform: 'LINKEDIN' | 'X';

  constructor(platform: 'LINKEDIN' | 'X') {
    this.platform = platform;
  }

  isConfigured(): boolean {
    return true; // Always available for local dev and testing
  }

  async validatePost(input: ValidatePostInput): Promise<ValidationResult> {
    if (this.platform === 'X' && input.text.length > 280) {
      return { valid: false, errors: ['Post exceeds 280 characters'] };
    }
    if (this.platform === 'LINKEDIN' && input.text.length < 100) {
      return { valid: false, errors: ['LinkedIn post too short (< 100 chars)'] };
    }
    return { valid: true, errors: [] };
  }

  async publishPost(input: PublishPostInput): Promise<PublishResult> {
    logger.info(`[MOCK PUBLISHER] Simulating publication on ${this.platform}`, {
      chars: input.text.length,
      isThread: input.isThread,
    });

    const timestamp = Date.now();
    if (this.platform === 'LINKEDIN') {
      const platformPostId = `urn:li:share:mock-${timestamp}`;
      return {
        success: true,
        platformPostId,
        postUrl: `https://www.linkedin.com/feed/update/${platformPostId}`,
      };
    } else {
      const platformPostId = `mock-tweet-${timestamp}`;
      return {
        success: true,
        platformPostId,
        postUrl: `https://x.com/developer/status/${platformPostId}`,
      };
    }
  }

  async getAccount(): Promise<AccountInfo> {
    return {
      platform: this.platform,
      accountId: `mock-${this.platform.toLowerCase()}-id`,
      accountName: `Demo Developer (${this.platform})`,
      username: `@dev_${this.platform.toLowerCase()}`,
      isConnected: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }
}
