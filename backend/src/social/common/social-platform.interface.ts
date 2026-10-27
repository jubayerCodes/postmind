import { SocialAccount } from '@prisma/client';

export interface ConnectedPageAccount {
  platformAccountId: string;
  accountName: string;
  accessToken: string;
  category?: string;
  tasks?: string[];
  avatarUrl?: string | null;
}

export interface PublishPostPayload {
  message: string;
  headline?: string;
  imageUrl?: string | null;
  cta?: string | null;
  link?: string;
}

export interface PublishResult {
  success: boolean;
  platformPostId: string;
  permalinkUrl?: string;
  publishedAt: Date;
}

export interface PostMetricsResult {
  platformPostId: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  reach?: number;
  impressions?: number;
}

export interface SocialPlatformProvider {
  getAuthUrl(storeId: string, state: string): string;
  exchangeCodeForPages(code: string, redirectUri: string): Promise<ConnectedPageAccount[]>;
  publishPost(
    account: SocialAccount,
    decryptedToken: string,
    payload: PublishPostPayload,
  ): Promise<PublishResult>;
  getMetrics(
    account: SocialAccount,
    decryptedToken: string,
    platformPostId: string,
  ): Promise<PostMetricsResult>;
}
