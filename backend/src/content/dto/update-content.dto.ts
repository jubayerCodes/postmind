import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ContentStatus, ContentTone, PostType } from '@prisma/client';

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];

  @IsString()
  @IsOptional()
  cta?: string;

  @IsEnum(PostType)
  @IsOptional()
  postType?: PostType;

  @IsEnum(ContentTone)
  @IsOptional()
  tone?: ContentTone;

  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsString()
  @IsOptional()
  language?: string;
}
