import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SchedulingService } from './scheduling.service';
import { SocialService } from '../social/social.service';

@Injectable()
export class SchedulerWorker {
  private readonly logger = new Logger(SchedulerWorker.name);
  private readonly inFlightPostIds = new Set<string>();

  constructor(
    private readonly schedulingService: SchedulingService,
    private readonly socialService: SocialService,
  ) {}

  /**
   * Periodic scheduler poller.
   * Runs every 15 seconds to identify and publish due posts without blocking requests.
   */
  @Cron('*/15 * * * * *')
  async pollAndPublishDuePosts(): Promise<void> {
    try {
      const duePosts = await this.schedulingService.findDueScheduledPosts();

      if (duePosts.length === 0) {
        return;
      }

      this.logger.log(
        `[SchedulerWorker] Detected ${duePosts.length} post(s) ready for scheduled publication`,
      );

      for (const post of duePosts) {
        // Prevent concurrent processing of the same post
        if (this.inFlightPostIds.has(post.id)) {
          continue;
        }

        this.inFlightPostIds.add(post.id);

        try {
          this.logger.log(
            `[SchedulerWorker] Publishing scheduled post "${post.headline}" (ID: ${post.id}) for store: ${post.storeId}`,
          );

          await this.socialService.publishPost(post.storeId, post.id);

          this.logger.log(
            `[SchedulerWorker] Successfully auto-published post ${post.id} to connected Facebook Page!`,
          );
        } catch (error: any) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `[SchedulerWorker] Auto-publish failed for post ${post.id}: ${errorMessage}`,
          );

          await this.schedulingService.markPostFailed(
            post.id,
            errorMessage,
          );
        } finally {
          this.inFlightPostIds.delete(post.id);
        }
      }
    } catch (err) {
      this.logger.error('[SchedulerWorker] Error during poll execution:', err);
    }
  }
}
