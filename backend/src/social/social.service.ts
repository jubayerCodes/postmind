import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CryptoService } from '../common/crypto/crypto.service';
import { MetaGraphService } from './meta/meta-graph.service';
import { ConnectDevAccountDto } from './dto/connect-dev-account.dto';
import {
  ContentStatus,
  SocialConnectionStatus,
  SocialPlatform,
  SocialAccount,
} from '@prisma/client';

export type SafeSocialAccount = Omit<SocialAccount, 'encryptedAccessToken'>;

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly metaGraphService: MetaGraphService,
  ) {}

  /**
   * Generates Facebook OAuth URL for a store.
   */
  async getConnectUrl(
    storeId: string,
    redirectUri?: string,
  ): Promise<{ url: string; state: string }> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException(`Store with ID '${storeId}' not found`);
    }

    const state = `postmind_${storeId}_${Date.now()}`;
    const url = this.metaGraphService.getAuthUrl(storeId, state, redirectUri);

    return { url, state };
  }

  /**
   * Handles OAuth code exchange, encrypts Page Access Tokens with AES-256-GCM, and stores pages.
   */
  async handleCallback(
    storeId: string,
    code: string,
    redirectUri?: string,
  ): Promise<SafeSocialAccount[]> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException(`Store with ID '${storeId}' not found`);
    }

    const pages = await this.metaGraphService.exchangeCodeForPages(
      code,
      redirectUri,
    );

    const savedAccounts: SafeSocialAccount[] = [];

    for (const page of pages) {
      const encryptedToken = this.cryptoService.encrypt(page.accessToken);

      const account = await this.prisma.socialAccount.upsert({
        where: {
          storeId_platform_platformAccountId: {
            storeId,
            platform: SocialPlatform.META_FACEBOOK,
            platformAccountId: page.platformAccountId,
          },
        },
        update: {
          accountName: page.accountName,
          avatarUrl: page.avatarUrl || null,
          encryptedAccessToken: encryptedToken,
          status: SocialConnectionStatus.CONNECTED,
          tokenExpiresAt: null,
        },
        create: {
          storeId,
          platform: SocialPlatform.META_FACEBOOK,
          platformAccountId: page.platformAccountId,
          accountName: page.accountName,
          avatarUrl: page.avatarUrl || null,
          encryptedAccessToken: encryptedToken,
          status: SocialConnectionStatus.CONNECTED,
        },
        select: {
          id: true,
          storeId: true,
          platform: true,
          platformAccountId: true,
          accountName: true,
          avatarUrl: true,
          status: true,
          tokenExpiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      savedAccounts.push(account as SafeSocialAccount);
    }

    return savedAccounts;
  }

  /**
   * Developer Sandbox Helper: Connects a simulated Facebook Page instantly for local development and testing.
   */
  async connectDevPage(
    storeId: string,
    dto?: ConnectDevAccountDto,
  ): Promise<SafeSocialAccount> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException(`Store with ID '${storeId}' not found`);
    }

    const platformAccountId =
      dto?.platformAccountId || `dev_sandbox_page_${storeId}`;
    const pageName =
      dto?.pageName || `${store.name} (Official Facebook Page)`;
    const avatarUrl =
      dto?.avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name || pageName)}&background=1877F2&color=fff&size=160&bold=true`;
    const mockToken = `dev_mock_token_${storeId}_${Date.now()}`;
    const encryptedToken = this.cryptoService.encrypt(mockToken);

    const account = await this.prisma.socialAccount.upsert({
      where: {
        storeId_platform_platformAccountId: {
          storeId,
          platform: SocialPlatform.META_FACEBOOK,
          platformAccountId,
        },
      },
      update: {
        accountName: pageName,
        avatarUrl,
        encryptedAccessToken: encryptedToken,
        status: SocialConnectionStatus.CONNECTED,
        tokenExpiresAt: null,
      },
      create: {
        storeId,
        platform: SocialPlatform.META_FACEBOOK,
        platformAccountId,
        accountName: pageName,
        avatarUrl,
        encryptedAccessToken: encryptedToken,
        status: SocialConnectionStatus.CONNECTED,
      },
      select: {
        id: true,
        storeId: true,
        platform: true,
        platformAccountId: true,
        accountName: true,
        avatarUrl: true,
        status: true,
        tokenExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return account as SafeSocialAccount;
  }

  /**
   * Returns all connected social accounts for a store, sanitized without access tokens.
   */
  async getConnectedAccounts(storeId: string): Promise<SafeSocialAccount[]> {
    return this.prisma.socialAccount.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        storeId: true,
        platform: true,
        platformAccountId: true,
        accountName: true,
        avatarUrl: true,
        status: true,
        tokenExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }) as Promise<SafeSocialAccount[]>;
  }

  /**
   * Disconnects and removes a social account.
   */
  async disconnectAccount(
    storeId: string,
    accountId: string,
  ): Promise<{ success: boolean; message: string }> {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: accountId, storeId },
    });

    if (!account) {
      throw new NotFoundException(
        `Social account with ID '${accountId}' not found in this store`,
      );
    }

    await this.prisma.socialAccount.delete({
      where: { id: accountId },
    });

    return { success: true, message: 'Social account disconnected successfully' };
  }

  /**
   * Publishes an approved post to a connected Facebook Page.
   */
  async publishPost(
    storeId: string,
    contentId: string,
    socialAccountId?: string,
  ): Promise<{
    success: boolean;
    content: any;
    publishResult: { platformPostId: string; permalinkUrl?: string; publishedAt: Date };
  }> {
    const content = await this.prisma.content.findFirst({
      where: { id: contentId, storeId },
      include: { product: true },
    });

    if (!content) {
      throw new NotFoundException(
        `Content with ID '${contentId}' not found in this store`,
      );
    }

    // Locate the target social account
    let account: SocialAccount | null = null;
    if (socialAccountId) {
      account = await this.prisma.socialAccount.findFirst({
        where: {
          id: socialAccountId,
          storeId,
          status: SocialConnectionStatus.CONNECTED,
        },
      });
    } else {
      account = await this.prisma.socialAccount.findFirst({
        where: {
          storeId,
          platform: SocialPlatform.META_FACEBOOK,
          status: SocialConnectionStatus.CONNECTED,
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!account || !account.encryptedAccessToken) {
      throw new BadRequestException(
        'No connected Facebook Page found for this store. Please connect a Facebook Page in Settings before publishing.',
      );
    }

    // Decrypt the page access token
    let decryptedToken: string;
    try {
      decryptedToken = this.cryptoService.decrypt(account.encryptedAccessToken);
    } catch (err) {
      this.logger.error('Token decryption failed during publishing', err);
      throw new BadRequestException(
        'Saved authorization token is invalid or corrupted. Please reconnect your Facebook Page.',
      );
    }

    // Format post message with hashtags and CTA if not already in caption
    let fullMessage = content.caption;
    if (
      content.hashtags &&
      content.hashtags.length > 0 &&
      !fullMessage.includes('#')
    ) {
      fullMessage += `\n\n${content.hashtags.join(' ')}`;
    }
    if (content.cta && !fullMessage.includes(content.cta)) {
      fullMessage += `\n\n👉 ${content.cta}`;
    }

    try {
      const publishResult = await this.metaGraphService.publishPost(
        account,
        decryptedToken,
        {
          message: fullMessage,
          headline: content.headline,
          imageUrl: content.product?.image || null,
          cta: content.cta,
        },
      );

      // Persist publication state in database
      const updatedContent = await this.prisma.content.update({
        where: { id: contentId },
        data: {
          status: ContentStatus.PUBLISHED,
          publishedAt: publishResult.publishedAt,
          platformPostId: publishResult.platformPostId,
          publishError: null,
          metricsLastSyncedAt: new Date(),
        },
        include: { product: true },
      });

      return {
        success: true,
        content: updatedContent,
        publishResult,
      };
    } catch (publishErr) {
      const errorMessage =
        publishErr instanceof Error ? publishErr.message : String(publishErr);

      // Save error details on the content item for audit and UI feedback
      await this.prisma.content.update({
        where: { id: contentId },
        data: {
          publishError: errorMessage,
        },
      });

      throw new BadRequestException(`Facebook publishing failed: ${errorMessage}`);
    }
  }

  /**
   * Syncs latest engagement metrics (reactions, comments, shares) from Meta Graph API for a published post.
   */
  async syncPostMetrics(
    storeId: string,
    contentId: string,
  ): Promise<{
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    metricsLastSyncedAt: Date;
    content: any;
  }> {
    const content = await this.prisma.content.findFirst({
      where: { id: contentId, storeId },
      include: { product: true },
    });

    if (!content) {
      throw new NotFoundException(
        `Content post with ID '${contentId}' not found in this store`,
      );
    }

    if (!content.platformPostId || content.status !== ContentStatus.PUBLISHED) {
      return {
        likesCount: content.likesCount || 0,
        commentsCount: content.commentsCount || 0,
        sharesCount: content.sharesCount || 0,
        metricsLastSyncedAt: content.metricsLastSyncedAt || new Date(),
        content,
      };
    }

    const account = await this.prisma.socialAccount.findFirst({
      where: {
        storeId,
        platform: SocialPlatform.META_FACEBOOK,
        status: SocialConnectionStatus.CONNECTED,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!account || !account.encryptedAccessToken) {
      throw new BadRequestException(
        'No connected Facebook Page found for this store to sync metrics',
      );
    }

    let decryptedToken: string;
    try {
      decryptedToken = this.cryptoService.decrypt(account.encryptedAccessToken);
    } catch (err) {
      this.logger.error('Token decryption failed during metrics sync', err);
      throw new BadRequestException('Invalid or expired social token');
    }

    const metrics = await this.metaGraphService.getMetrics(
      account,
      decryptedToken,
      content.platformPostId,
    );

    const now = new Date();
    const updatedContent = await this.prisma.content.update({
      where: { id: contentId },
      data: {
        likesCount: metrics.likesCount,
        commentsCount: metrics.commentsCount,
        sharesCount: metrics.sharesCount,
        metricsLastSyncedAt: now,
      },
      include: { product: true },
    });

    return {
      likesCount: metrics.likesCount,
      commentsCount: metrics.commentsCount,
      sharesCount: metrics.sharesCount,
      metricsLastSyncedAt: now,
      content: updatedContent,
    };
  }
}
