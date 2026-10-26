import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { SchedulePostDto } from './dto/schedule-post.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { StoreTenantGuard } from '../common/guards/store-tenant.guard';

@Controller('stores/:storeId/scheduling')
@UseGuards(SupabaseAuthGuard, StoreTenantGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('posts/:contentId')
  @HttpCode(HttpStatus.OK)
  async schedulePost(
    @Param('storeId') storeId: string,
    @Param('contentId') contentId: string,
    @Body() dto: SchedulePostDto,
  ) {
    const post = await this.schedulingService.schedulePost(
      storeId,
      contentId,
      dto.scheduledAt,
    );
    return { post, message: 'Post successfully scheduled' };
  }

  @Delete('posts/:contentId')
  @HttpCode(HttpStatus.OK)
  async cancelSchedule(
    @Param('storeId') storeId: string,
    @Param('contentId') contentId: string,
  ) {
    const post = await this.schedulingService.cancelSchedule(storeId, contentId);
    return { post, message: 'Schedule cancelled successfully' };
  }

  @Get('calendar')
  async getCalendarPosts(
    @Param('storeId') storeId: string,
    @Query() query: CalendarQueryDto,
  ) {
    return this.schedulingService.getCalendarPosts(storeId, query);
  }
}
