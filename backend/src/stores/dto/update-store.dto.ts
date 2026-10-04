import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateStoreDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  timezone?: string;
}
