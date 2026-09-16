import {
  SocialPublisher,
  PublishPostInput,
  PublishResult,
  ValidatePostInput,
  ValidationResult,
  AccountInfo,
} from './types';
import { prisma } from '@/packages/database';
import { decryptSecret, ExternalApiError, RateLimitError, logger, env } from '@/packages/config';

export class LinkedInPublisher implements SocialPublisher {
  public readonly platform = 'LINKEDIN';

  isConfigured(): boolean {
    return Boolean(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET);
  }

  async validatePost(input: ValidatePostInput): Promise<ValidationResult> {
    const errors: string[] = [];
    if (input.text.length < 50) errors.push('Post is too short (< 50 characters)');
    if (input.text.length > 3000) errors.push('Post exceeds LinkedIn maximum limit (3000 characters)');
    return { valid: errors.length === 0, errors };
  }

  async getAccount(): Promise<AccountInfo> {
    const account = await prisma.account.findUnique({ where: { platform: 'LINKEDIN' } });
    if (!account) {
      return {
        platform: 'LINKEDIN',
        accountId: '',
        accountName: 'Not Connected',
        isConnected: false,
      };
    }

    return {
      platform: 'LINKEDIN',
      accountId: account.accountId,
      accountName: account.accountName,
      username: account.username || undefined,
      avatarUrl: account.avatarUrl || undefined,
      isConnected: true,
      expiresAt: account.tokenExpiresAt || undefined,
    };
  }

  private async getDecryptedToken(): Promise<{ accessToken: string; personUrn: string }> {
    const account = await prisma.account.findUnique({ where: { platform: 'LINKEDIN' } });
    if (!account) {
      throw new ExternalApiError(
        'LinkedIn',
        'LinkedIn account is not connected. Connect account via /settings/integrations.'
      );
    }

    if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
      throw new ExternalApiError(
        'LinkedIn',
        'LinkedIn OAuth access token has expired. Please re-authenticate.'
      );
    }

    const accessToken = decryptSecret(account.accessTokenEnc);
    const personUrn = account.accountId.startsWith('urn:li:')
      ? account.accountId
      : `urn:li:person:${account.accountId}`;

    return { accessToken, personUrn };
  }

  async publishPost(input: PublishPostInput): Promise<PublishResult> {
    logger.info('LinkedInPublisher: publishing post to official LinkedIn REST API');

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Implemented but awaiting credentials (LINKEDIN_CLIENT_ID & LINKEDIN_CLIENT_SECRET in .env)',
      };
    }

    const { accessToken, personUrn } = await this.getDecryptedToken();

    // LinkedIn REST Posts API v202401
    const url = 'https://api.linkedin.com/rest/posts';
    const payload = {
      author: personUrn,
      commentary: input.text,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('Retry-After')) || 60;
      throw new RateLimitError('LinkedIn', retryAfter);
    }

    if (!response.ok) {
      const errText = await response.text();
      logger.error('LinkedIn API error response', { status: response.status, body: errText });
      return {
        success: false,
        error: `LinkedIn API error (HTTP ${response.status}): ${errText}`,
      };
    }

    // 201 Created returns Urn in x-restli-id or x-linkedin-id header
    const postId = response.headers.get('x-restli-id') || response.headers.get('x-linkedin-id') || `urn:li:share:${Date.now()}`;
    const postUrl = `https://www.linkedin.com/feed/update/${postId}`;

    logger.info(`✅ Successfully published post to LinkedIn: ${postId}`);
    return {
      success: true,
      platformPostId: postId,
      postUrl,
    };
  }
}
