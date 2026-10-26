import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';
import { SchedulerWorker } from './scheduler.worker';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [SocialModule],
  controllers: [SchedulingController],
  providers: [SchedulingService, SchedulerWorker],
  exports: [SchedulingService],
})
export class SchedulingModule {}
