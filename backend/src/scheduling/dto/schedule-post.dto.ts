import { IsNotEmpty, IsISO8601 } from 'class-validator';

export class SchedulePostDto {
  @IsNotEmpty()
  @IsISO8601()
  scheduledAt!: string;
}
