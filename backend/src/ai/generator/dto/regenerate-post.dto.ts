import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContentToneEnum } from './generate-post.dto';

export class RegeneratePostDto {
  @IsEnum(ContentToneEnum)
  @IsOptional()
  tone?: ContentToneEnum;

  @IsString()
  @IsOptional()
  customPrompt?: string;

  @IsString()
  @IsOptional()
  offerDetails?: string;
}
