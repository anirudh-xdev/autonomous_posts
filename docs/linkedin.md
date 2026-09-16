# LinkedIn Publishing & Official API Integration

## Overview
The LinkedIn integration enables automated or approval-based publishing of technical posts to personal profiles or company pages using the official LinkedIn REST API.

> **Zero-Scraping Guarantee**: Scraping, headless browser automation (Playwright, Puppeteer, Selenium), and unofficial private API hacks are strictly prohibited. All LinkedIn publishing uses official OAuth-authenticated REST endpoints.

## Official API Architecture
- **Base Endpoint**: `https://api.linkedin.com/rest/posts`
- **Required Protocol Headers**:
  - `Authorization: Bearer <access_token>`
  - `LinkedIn-Version: 202401`
  - `X-Restli-Protocol-Version: 2.0.0`
  - `Content-Type: application/json`
- **Author URN**:
  - Personal member profile: `urn:li:person:<PERSON_ID>`
  - Organization / Company page: `urn:li:organization:<ORG_ID>`

## Post Payload Format
```json
{
  "author": "urn:li:person:abcdef1234",
  "commentary": "DeepSeek-V3 architecture breakdown: FP8 mixed precision training enables 90% bandwidth reduction without accuracy degradation.\n\nKey takeaways for engineering teams:\n• DualPipe scheduling overlaps forward/backward passes\n• Native multi-head latent attention (MLA) compresses KV cache by 93%\n• Full weights available on HuggingFace\n\nWhat are your thoughts on deploying MLA architectures locally?\n\n#MachineLearning #AI #SoftwareEngineering",
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

## OAuth 2.0 Setup Guide
1. Create an application in the [LinkedIn Developer Portal](https://www.linkedin.com/developers/).
2. Request the following products/scopes:
   - `openid`, `profile`, `email`
   - `w_member_social` (to publish on personal profile)
   - `w_organization_social` (optional, to publish on company pages)
3. Set your OAuth 2.0 Redirect URL to: `https://your-domain.com/api/auth/linkedin/callback`
4. Complete the OAuth flow to retrieve your Access Token and Author URN.
5. Configure in your `.env`:
```env
LINKEDIN_CLIENT_ID="your_client_id"
LINKEDIN_CLIENT_SECRET="your_client_secret"
LINKEDIN_ACCESS_TOKEN="your_access_token"
LINKEDIN_AUTHOR_URN="urn:li:person:your_member_id"
```

## Security & Encryption
- All access tokens stored in the database are encrypted at rest using AES-256-GCM.
- In development without API keys, `MockPublisher` simulates successful publication and logs `"Implemented but awaiting credentials"`.
