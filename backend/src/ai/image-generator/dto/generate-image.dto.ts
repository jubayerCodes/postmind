import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class GenerateProductImageDto {
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsOptional()
  features?: string[];
}
