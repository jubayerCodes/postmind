import { IsEnum, IsOptional, IsString } from 'class-validator';

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
  tone: ContentToneEnum = ContentToneEnum.NATURAL;

  @IsString()
  @IsOptional()
  customPrompt?: string;

  @IsString()
  @IsOptional()
  offerDetails?: string;
}
