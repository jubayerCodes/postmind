---
name: meta-api-integration
description: "Reference guide and security standards for Meta Graph API integration, Facebook Pages OAuth token lifecycle, encrypted credential storage, and publishing error recovery in PostMind."
---

# Meta API Integration Guidelines for PostMind

## 1. Social Platform Abstraction

PostMind must never tightly couple domain logic to Meta Graph API directly. All social networks implement a standard interface:

```typescript
export interface SocialPlatformProvider {
  getAuthUrl(storeId: string, state: string): string;
  handleCallback(code: string): Promise<ConnectedAccountData>;
  publishPost(account: ConnectedAccount, post: PostPayload): Promise<PublishResult>;
  getMetrics(account: ConnectedAccount, platformPostId: string): Promise<PostMetricsResult>;
  refreshToken(account: ConnectedAccount): Promise<string>;
}
```

## 2. Meta OAuth Token Flow

1. Merchant initiates OAuth with Meta for Page management.
2. Scopes requested: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`.
3. Exchange short-lived User Access Token for a **Long-Lived User Access Token** (60 days).
4. Fetch Page Access Tokens with `GET /me/accounts` (Page tokens derived from long-lived user tokens do not expire unless password is changed or permissions revoked).

## 3. Security & Token Encryption

- Never store plain-text access tokens in PostgreSQL.
- Encrypt tokens at rest using **AES-256-GCM** with a master secret key:
  ```typescript
  // Encrypted format: iv:authTag:encryptedData (hex encoded)
  ```
- Never return access tokens to the frontend API response.
