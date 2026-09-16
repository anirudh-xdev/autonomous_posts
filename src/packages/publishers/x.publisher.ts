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

export class XPublisher implements SocialPublisher {
  public readonly platform = 'X';

  isConfigured(): boolean {
    return Boolean(env.X_CLIENT_ID && env.X_CLIENT_SECRET);
  }

  async validatePost(input: ValidatePostInput): Promise<ValidationResult> {
    const errors: string[] = [];
    if (input.text.length > 280) errors.push('Single post exceeds 280 characters');
    if (input.isThread && input.threadPosts) {
      input.threadPosts.forEach((p, idx) => {
        if (p.length > 280) errors.push(`Thread post #${idx + 1} exceeds 280 characters`);
      });
    }
    return { valid: errors.length === 0, errors };
  }

  async getAccount(): Promise<AccountInfo> {
    const account = await prisma.account.findUnique({ where: { platform: 'X' } });
    if (!account) {
      return {
        platform: 'X',
        accountId: '',
        accountName: 'Not Connected',
        isConnected: false,
      };
    }

    return {
      platform: 'X',
      accountId: account.accountId,
      accountName: account.accountName,
      username: account.username || undefined,
      avatarUrl: account.avatarUrl || undefined,
      isConnected: true,
      expiresAt: account.tokenExpiresAt || undefined,
    };
  }

  private async getDecryptedToken(): Promise<{ accessToken: string; username?: string }> {
    const account = await prisma.account.findUnique({ where: { platform: 'X' } });
    if (!account) {
      throw new ExternalApiError('X', 'X account is not connected. Connect account via /settings/integrations.');
    }

    if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
      throw new ExternalApiError('X', 'X OAuth token has expired. Please re-authenticate.');
    }

    const accessToken = decryptSecret(account.accessTokenEnc);
    return { accessToken, username: account.username || undefined };
  }

  async publishPost(input: PublishPostInput): Promise<PublishResult> {
    logger.info('XPublisher: publishing tweet / thread to official Twitter API v2');

    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Implemented but awaiting credentials (X_CLIENT_ID & X_CLIENT_SECRET in .env)',
      };
    }

    const { accessToken, username } = await this.getDecryptedToken();
    const url = 'https://api.twitter.com/2/tweets';

    // If not a thread, publish single tweet
    if (!input.isThread || !input.threadPosts || input.threadPosts.length <= 1) {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: input.text }),
      });

      if (res.status === 429) {
        const resetTime = Number(res.headers.get('x-rate-limit-reset')) || 0;
        const retryAfter = resetTime ? Math.max(1, resetTime - Math.floor(Date.now() / 1000)) : 60;
        throw new RateLimitError('X', retryAfter);
      }

      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `X API error (HTTP ${res.status}): ${err}` };
      }

      const json = (await res.json()) as { data: { id: string; text: string } };
      const tweetId = json.data.id;
      const postUrl = `https://x.com/${username || 'i'}/status/${tweetId}`;

      return { success: true, platformPostId: tweetId, postUrl };
    }

    // Thread Publishing
    let lastTweetId: string | null = null;
    let rootTweetId: string | null = null;

    for (let i = 0; i < input.threadPosts.length; i++) {
      const tweetText = input.threadPosts[i];
      const payload: { text: string; reply?: { in_reply_to_tweet_id: string } } = { text: tweetText };

      if (lastTweetId) {
        payload.reply = { in_reply_to_tweet_id: lastTweetId };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        return {
          success: false,
          platformPostId: rootTweetId || undefined,
          error: `Failed on thread tweet #${i + 1} (HTTP ${res.status}): ${err}`,
        };
      }

      const json = (await res.json()) as { data: { id: string } };
      lastTweetId = json.data.id;
      if (!rootTweetId) rootTweetId = json.data.id;
    }

    const postUrl = `https://x.com/${username || 'i'}/status/${rootTweetId}`;
    logger.info(`✅ Successfully published thread to X with root ID: ${rootTweetId}`);

    return {
      success: true,
      platformPostId: rootTweetId!,
      postUrl,
    };
  }
}
