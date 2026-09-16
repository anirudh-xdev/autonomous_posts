# X (Twitter) Publishing & Official API v2 Integration

## Overview
The X (Twitter) integration publishes single tweets and connected multi-tweet reply threads using the official Twitter API v2.

> **Zero-Scraping Guarantee**: Playwright, Puppeteer, Selenium, and browser cookie emulation are strictly prohibited. All interactions use the official Twitter API v2 endpoints authenticated with OAuth 1.0a or OAuth 2.0.

## Official API Architecture
- **Base Endpoint**: `https://api.twitter.com/2/tweets`
- **Supported Methods**: `POST` (create tweet / reply)
- **Character Limits**: Maximum 280 characters per tweet.

## Publishing Payloads

### 1. Single Tweet
```json
{
  "text": "DeepSeek-V3 architecture breakdown: FP8 mixed precision training enables 90% bandwidth reduction without accuracy loss. Full report: https://example.com"
}
```

### 2. Thread Reply
```json
{
  "text": "2/5 DualPipe scheduling overlaps forward and backward passes across pipeline stages, eliminating bubble latency.",
  "reply": {
    "in_reply_to_tweet_id": "1789553288644001"
  }
}
```

## Thread Publishing Sequence
The `XPublisher` executes threads sequentially:
1. Validates that every individual tweet in the thread array is $\le 280$ characters.
2. Posts Tweet 1 (Root); captures the returned `id`.
3. Posts Tweet 2 with `"reply": { "in_reply_to_tweet_id": id_1 }`; captures `id_2`.
4. Continues iteratively for all remaining tweets.
5. Returns the live root tweet URL: `https://x.com/user/status/${id_1}`.

## Developer Credentials Setup
1. Register a developer project in the [X Developer Portal](https://developer.x.com).
2. Ensure your App has **Read and Write** permissions.
3. Generate your Keys and Tokens:
   - Consumer Keys: API Key & Secret
   - Authentication Tokens: Access Token & Access Secret (User Context)
4. Add credentials to `.env`:
```env
X_API_KEY="your_api_key"
X_API_SECRET="your_api_secret"
X_ACCESS_TOKEN="your_access_token"
X_ACCESS_SECRET="your_access_token_secret"
X_BEARER_TOKEN="your_bearer_token"
```

## Rate Limits & Error Handling
- The Twitter API v2 Free and Basic tiers enforce strict monthly and daily write caps.
- The `PublishingCoordinator` enforces `MAX_POSTS_PER_DAY` (default: 2 publications per day) to prevent hitting account rate limits.
- When keys are unconfigured, `MockPublisher` provides clean simulated results for development.
