---
name: linkedin
description: Guide for authenticating, formatting, rate limiting, and publishing posts to LinkedIn using the official LinkedIn REST API (/rest/posts).
---

# LinkedIn Publishing Skill

## Purpose
Explains how to authenticate with LinkedIn using OAuth 2.0 (3-legged), format post payloads according to LinkedIn's official REST API specifications, enforce daily rate limits, and publish approved content without scraping or browser automation.

## When to Use
- When configuring LinkedIn Developer Application credentials (`LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_ACCESS_TOKEN`).
- When formatting post payloads for `/rest/posts` (member share, commentary, link previews).
- When debugging LinkedIn API errors (e.g. expired tokens, rate limit 429, invalid author URN).
- When testing the publishing flow using `MockPublisher` vs live API.

## Official LinkedIn API Architecture
The system uses the modern LinkedIn REST API:
- **Base Endpoint**: `https://api.linkedin.com/rest/posts`
- **Required Headers**:
  - `Authorization: Bearer <access_token>`
  - `LinkedIn-Version: 202401`
  - `X-Restli-Protocol-Version: 2.0.0`
  - `Content-Type: application/json`
- **Author URN Format**: `urn:li:person:<PERSON_ID>` or `urn:li:organization:<ORG_ID>`
- **Payload Structure**:
```json
{
  "author": "urn:li:person:abcdef123",
  "commentary": "Post body text with technical takeaways and discussion points...",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "lifecycleState": "PUBLISHED",
  "isReshareDisabledByAuthor": false
}
```

## Security & Encryption
1. **Zero Browser Automation**: Playwright and Selenium are strictly prohibited for LinkedIn posting.
2. **Encrypted Storage**: LinkedIn access tokens and refresh tokens are encrypted at rest using AES-256-GCM via `encryptToken` in `src/packages/config/crypto.ts`.
3. **Graceful Fallback**: If `LINKEDIN_ACCESS_TOKEN` is not provided, the factory routes calls to `MockPublisher`, which returns a mock publication record marked `Implemented but awaiting credentials`.

## Rate Limiting & Safety
- **Daily Post Limit**: Guarded by `MAX_POSTS_PER_DAY` (default: 2 posts per day across platforms).
- **Sensitive Topic Exclusion**: Posts discussing politics, medical diagnoses, hate speech, or financial advice are aborted prior to calling the external API.

## Important Files
- `src/packages/publishers/linkedin.publisher.ts`: Official REST API client.
- `src/packages/publishers/safety.service.ts`: Sensitive topic filter.
- `src/packages/publishers/publishing-coordinator.ts`: Enforces rate limits and orchestrates multi-platform publishing.

## Code Example
```typescript
import { LinkedInPublisher } from '@/packages/publishers/linkedin.publisher';

const publisher = new LinkedInPublisher();
const result = await publisher.publish({
  content: 'Exciting breakthrough in local quantized inference...',
  authorUrn: 'urn:li:person:123456',
  metadata: { trendId: 'abc-123' }
});

console.log(`LinkedIn post published with ID: ${result.remoteId}, URL: ${result.postUrl}`);
```
