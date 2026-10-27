import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialAccount } from '@prisma/client';
import {
  ConnectedPageAccount,
  PublishPostPayload,
  PublishResult,
  PostMetricsResult,
  SocialPlatformProvider,
} from '../common/social-platform.interface';

@Injectable()
export class MetaGraphService implements SocialPlatformProvider {
  private readonly logger = new Logger(MetaGraphService.name);
  private readonly graphApiVersion = 'v20.0';
  private readonly graphApiBase = 'https://graph.facebook.com/v20.0';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generates Facebook OAuth Authorization URL for merchant Facebook Page permissions.
   */
  getAuthUrl(storeId: string, state: string, redirectUriOverride?: string): string {
    const appId = this.configService.get<string>('META_APP_ID');
    const redirectUri =
      redirectUriOverride ||
      this.configService.get<string>('META_REDIRECT_URI') ||
      'http://localhost:3000/auth/callback/facebook';

    if (!appId) {
      // In dev simulator mode without Meta App credentials
      return `${redirectUri}?dev_mode=true&store_id=${encodeURIComponent(storeId)}&state=${encodeURIComponent(state)}`;
    }

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      state,
      scope: 'pages_show_list,pages_read_engagement,pages_manage_posts',
      response_type: 'code',
      auth_type: 'rerequest',
    });

    return `https://www.facebook.com/${this.graphApiVersion}/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for long-lived User Token and fetches merchant's Facebook Pages with Page Tokens.
   */
  async exchangeCodeForPages(
    code: string,
    customRedirectUri?: string,
  ): Promise<ConnectedPageAccount[]> {
    const appId = this.configService.get<string>('META_APP_ID');
    const appSecret = this.configService.get<string>('META_APP_SECRET');
    const redirectUri =
      customRedirectUri ||
      this.configService.get<string>('META_REDIRECT_URI') ||
      'http://localhost:3000/auth/callback/facebook';

    // If running in development sandbox mode without Meta App credentials
    if (!appId || !appSecret || code.startsWith('dev_')) {
      this.logger.log('Executing simulated Meta Page connection for local developer sandbox');
      return [
        {
          platformAccountId: 'dev_sandbox_page_oauth',
          accountName: 'UrbanWear Dhaka (Official Page)',
          accessToken: `dev_mock_page_token_${Date.now()}`,
          category: 'Clothing (Brand)',
          tasks: ['MANAGE', 'CREATE_CONTENT', 'MODERATE'],
        },
      ];
    }

    try {
      // 1. Exchange auth code for short-lived User Access Token
      const tokenUrl = `${this.graphApiBase}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;
      const tokenRes = await fetch(tokenUrl);
      if (!tokenRes.ok) {
        const err = await tokenRes.text().catch(() => '');
        throw new BadRequestException(`Meta OAuth token exchange failed: ${err}`);
      }
      const tokenData = await tokenRes.json();
      const shortLivedToken = tokenData.access_token;

      // 2. Exchange short-lived token for Long-Lived User Access Token (valid for 60 days)
      const longLivedUrl = `${this.graphApiBase}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
      const longLivedRes = await fetch(longLivedUrl);
      let userToken = shortLivedToken;
      if (longLivedRes.ok) {
        const longLivedData = await longLivedRes.json();
        userToken = longLivedData.access_token || shortLivedToken;
      }

      // 3. Fetch user's managed Facebook Pages and their respective Page Access Tokens
      const accountsUrl = `${this.graphApiBase}/me/accounts?fields=id,name,category,access_token,tasks&access_token=${userToken}`;
      const accountsRes = await fetch(accountsUrl);
      if (!accountsRes.ok) {
        const err = await accountsRes.text().catch(() => '');
        throw new BadRequestException(`Failed to retrieve Facebook Pages from Meta: ${err}`);
      }
      const accountsData = await accountsRes.json();

      if (!accountsData.data || !Array.isArray(accountsData.data) || accountsData.data.length === 0) {
        throw new BadRequestException(
          'No Facebook Pages found for this account. Ensure you are an Admin or Editor of at least one Facebook Page.',
        );
      }

      return accountsData.data.map((page: any) => ({
        platformAccountId: page.id,
        accountName: page.name,
        accessToken: page.access_token,
        category: page.category,
        tasks: page.tasks || [],
      }));
    } catch (error) {
      this.logger.error('Meta OAuth exchange error', error);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(error instanceof Error ? error.message : 'Meta authorization failed');
    }
  }

  /**
   * Publishes post to Facebook Page using Meta Graph API (or Sandbox Simulator).
   */
  async publishPost(
    account: SocialAccount,
    decryptedToken: string,
    payload: PublishPostPayload,
  ): Promise<PublishResult> {
    const isMock =
      decryptedToken.startsWith('dev_') ||
      !this.configService.get<string>('META_APP_ID');

    if (isMock) {
      this.logger.log(
        `[Sandbox Simulator] Publishing post to Facebook Page: "${account.accountName}" (ID: ${account.platformAccountId})`,
      );
      // Simulate realistic network delay
      await new Promise((resolve) => setTimeout(resolve, 400));

      const mockPostId = `${account.platformAccountId}_${Date.now()}`;
      return {
        success: true,
        platformPostId: mockPostId,
        permalinkUrl: `https://facebook.com/${mockPostId}`,
        publishedAt: new Date(),
      };
    }

    try {
      const pageId = account.platformAccountId;
      let endpoint = `${this.graphApiBase}/${pageId}/feed`;
      const bodyParams: Record<string, string> = {
        access_token: decryptedToken,
      };

      if (payload.imageUrl) {
        // Photo upload with caption
        endpoint = `${this.graphApiBase}/${pageId}/photos`;
        bodyParams.url = payload.imageUrl;
        bodyParams.caption = payload.message;
      } else {
        // Status update / feed message
        bodyParams.message = payload.message;
        if (payload.link) {
          bodyParams.link = payload.link;
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(bodyParams).toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.error?.message ||
          `Meta Graph API publishing failed with status ${response.status}`;
        throw new BadRequestException(message);
      }

      const resData = await response.json();
      const platformPostId = resData.post_id || resData.id;

      return {
        success: true,
        platformPostId,
        permalinkUrl: `https://facebook.com/${platformPostId}`,
        publishedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Meta publishing error', error);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(error instanceof Error ? error.message : 'Facebook publish failed');
    }
  }

  /**
   * Retrieves post engagement metrics from Meta Graph API.
   */
  async getMetrics(
    account: SocialAccount,
    decryptedToken: string,
    platformPostId: string,
  ): Promise<PostMetricsResult> {
    const isMock =
      decryptedToken.startsWith('dev_') ||
      !this.configService.get<string>('META_APP_ID');

    if (isMock) {
      return {
        platformPostId,
        likesCount: Math.floor(180 + Math.random() * 2500),
        commentsCount: Math.floor(12 + Math.random() * 120),
        sharesCount: Math.floor(4 + Math.random() * 45),
        reach: Math.floor(1200 + Math.random() * 8000),
        impressions: Math.floor(1800 + Math.random() * 12000),
      };
    }

    try {
      const url = `${this.graphApiBase}/${platformPostId}?fields=reactions.summary(total_count),comments.summary(total_count),shares&access_token=${decryptedToken}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch metrics: ${res.statusText}`);
      }
      const data = await res.json();

      return {
        platformPostId,
        likesCount: data.reactions?.summary?.total_count || 0,
        commentsCount: data.comments?.summary?.total_count || 0,
        sharesCount: data.shares?.count || 0,
      };
    } catch (error) {
      this.logger.warn(`Failed to fetch Meta metrics for ${platformPostId}:`, error);
      return {
        platformPostId,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
      };
    }
  }
}
