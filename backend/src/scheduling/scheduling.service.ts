import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { Content, ContentStatus } from '@prisma/client';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Schedules a content post for automated publication at a specified date and time.
   */
  async schedulePost(
    storeId: string,
    contentId: string,
    scheduledAtStr: string,
  ): Promise<Content> {
    const scheduledAt = new Date(scheduledAtStr);

    if (isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Invalid date format for scheduledAt');
    }

    const now = new Date();
    // Allow up to 30 seconds leeway for clock skew
    if (scheduledAt.getTime() < now.getTime() - 30 * 1000) {
      throw new BadRequestException(
        'Scheduled time must be in the future. Please select an upcoming slot.',
      );
    }

    const content = await this.prisma.content.findFirst({
      where: { id: contentId, storeId },
    });

    if (!content) {
      throw new NotFoundException(
        `Content with ID '${contentId}' not found in this store`,
      );
    }

    if (content.status === ContentStatus.PUBLISHED) {
      throw new BadRequestException(
        'This post has already been published and cannot be scheduled again.',
      );
    }

    const updated = await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: ContentStatus.SCHEDULED,
        scheduledAt,
        publishError: null,
      },
      include: {
        product: true,
      },
    });

    this.logger.log(
      `Post ${contentId} successfully scheduled for ${scheduledAt.toISOString()} (Store: ${storeId})`,
    );

    return updated;
  }

  /**
   * Cancels a scheduled post and reverts its status to READY.
   */
  async cancelSchedule(storeId: string, contentId: string): Promise<Content> {
    const content = await this.prisma.content.findFirst({
      where: { id: contentId, storeId },
    });

    if (!content) {
      throw new NotFoundException(
        `Content with ID '${contentId}' not found in this store`,
      );
    }

    const updated = await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: ContentStatus.READY,
        scheduledAt: null,
      },
      include: {
        product: true,
      },
    });

    this.logger.log(
      `Scheduled post ${contentId} was cancelled and reverted to READY (Store: ${storeId})`,
    );

    return updated;
  }

  /**
   * Fetches calendar posts for a specific month or date range.
   */
  async getCalendarPosts(
    storeId: string,
    query: CalendarQueryDto,
  ): Promise<{ posts: Content[]; total: number }> {
    let start: Date;
    let end: Date;

    if (query.month && /^\d{4}-\d{2}$/.test(query.month)) {
      const [yearStr, monthStr] = query.month.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      // Start of month (UTC)
      start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      // End of month (UTC)
      end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    } else if (query.startDate && query.endDate) {
      start = new Date(query.startDate);
      end = new Date(query.endDate);
    } else {
      // Default to current month window + / - 15 days
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const posts = await this.prisma.content.findMany({
      where: {
        storeId,
        OR: [
          {
            scheduledAt: {
              gte: start,
              lte: end,
            },
          },
          {
            publishedAt: {
              gte: start,
              lte: end,
            },
          },
          {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        ],
      },
      include: {
        product: true,
      },
      orderBy: [
        { scheduledAt: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return { posts, total: posts.length };
  }

  /**
   * Worker Helper: Finds all posts across all stores that have reached their scheduledAt time and need publishing.
   */
  async findDueScheduledPosts(): Promise<Content[]> {
    return this.prisma.content.findMany({
      where: {
        status: ContentStatus.SCHEDULED,
        scheduledAt: {
          lte: new Date(),
        },
      },
      include: {
        product: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  /**
   * Worker Helper: Marks a post as FAILED if automated background dispatch failed.
   */
  async markPostFailed(contentId: string, error: string): Promise<void> {
    await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: ContentStatus.FAILED,
        publishError: error,
      },
    });
  }
}
