---
name: x
description: Guide for authenticating, formatting, character validation, and publishing single tweets and threads to X (formerly Twitter) using the official Twitter API v2.
---

# X (Twitter) Publishing Skill

## Purpose
Explains how to authenticate with the official Twitter API v2 using OAuth 1.0a or OAuth 2.0 User Context, publish single tweets and multi-tweet reply threads, and validate character constraints without scraping.

## When to Use
- When configuring X Developer App API credentials (`X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`, `X_BEARER_TOKEN`).
- When formatting thread replies (`in_reply_to_tweet_id`) via `/2/tweets`.
- When debugging X API errors (e.g. status 403 Forbidden, 429 Rate Limit, duplicate tweet error 187).
- When validating tweet character limits ($\le 280$ characters per tweet).

## Official Twitter API v2 Architecture
- **Base Endpoint**: `https://api.twitter.com/2/tweets`
- **Authentication**:
  - OAuth 1.0a User Context (HMAC-SHA1) with API Key, API Secret, Access Token, Access Secret.
  - Or OAuth 2.0 PKCE User Access Token.
- **Single Tweet Payload**:
```json
{
  "text": "DeepSeek-V3 architecture breakdown: FP8 mixed precision training enables 90% bandwidth reduction without accuracy loss. Full report: https://example.com"
}
```
- **Thread Reply Payload**:
```json
{
  "text": "2/7 How does DualPipe scheduling work? It overlaps computation of forward and backward passes across pipeline stages...",
  "reply": {
    "in_reply_to_tweet_id": "1789553288644001"
  }
}
```

## Thread Publishing Logic
The `XPublisher` publishes threads sequentially:
1. Validates every tweet in the array against the 280-character limit.
2. Publishes Tweet 1 as a root tweet; receives `tweet_id_1`.
3. Publishes Tweet 2 with `"reply": { "in_reply_to_tweet_id": tweet_id_1 }`; receives `tweet_id_2`.
4. Repeats sequentially for all $N$ tweets in the thread.
5. Returns the URL of the root tweet: `https://x.com/user/status/${tweet_id_1}`.

## Rate Limiting & Safety
- **X API v2 Free/Basic Tier Constraints**: Free tier allows write-only access to 1,500 tweets/month per app and 500 tweets/month per user. Basic tier allows 3,000 tweets/user/month.
- **Rate Limit Guard**: Handled by `PublishingCoordinator` (max 2 publications per day).
- **Sensitive Topic Exclusion**: Strictly checked before issuing any network requests to X API.

## Important Files
- `src/packages/publishers/x.publisher.ts`: Official Twitter API v2 client.
- `src/packages/publishers/publisher.factory.ts`: Instantiates real or mock publisher based on environment keys.
- `src/packages/publishers/safety.service.ts`: Sensitive topic filter.

## Code Example
```typescript
import { XPublisher } from '@/packages/publishers/x.publisher';

const publisher = new XPublisher();

// Publishing a thread
const threadResult = await publisher.publishThread([
  '1/3 Breakthrough in speculative decoding: Medusa heads predict multiple tokens concurrently.',
  '2/3 Eliminates tree verification overhead by using top-k acceptance with minimal memory footprint.',
  '3/3 Code and weights are Apache 2.0 licensed: https://github.com/example/repo'
]);

console.log(`X thread published. Root tweet: ${threadResult.postUrl}`);
```
