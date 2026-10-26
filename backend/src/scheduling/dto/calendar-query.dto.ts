import { IsOptional, IsISO8601, IsString } from 'class-validator';

export class CalendarQueryDto {
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsString()
  month?: string; // YYYY-MM
}
