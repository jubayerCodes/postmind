import { IsOptional, IsString } from 'class-validator';

export class PublishContentDto {
  @IsOptional()
  @IsString()
  socialAccountId?: string;
}
