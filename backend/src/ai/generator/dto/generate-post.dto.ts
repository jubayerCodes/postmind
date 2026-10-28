import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ContentToneEnum {
  NATURAL = 'NATURAL',
  WITTY = 'WITTY',
  PROMO = 'PROMO',
  STORYTELLING = 'STORYTELLING',
}

export class GeneratePostDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsEnum(ContentToneEnum)
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  tone: ContentToneEnum = ContentToneEnum.NATURAL;

  @IsString()
  @IsOptional()
  customPrompt?: string;

  @IsString()
  @IsOptional()
  offerDetails?: string;

  @IsString()
  @IsOptional()
  sourceHeadline?: string;

  @IsString()
  @IsOptional()
  sourceCaption?: string;

  @IsString()
  @IsOptional()
  language?: string = 'en';
}
