import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ContentStatus, ContentTone, PostType } from '@prisma/client';

export class CreateContentDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  headline!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  caption!: string;

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
}
