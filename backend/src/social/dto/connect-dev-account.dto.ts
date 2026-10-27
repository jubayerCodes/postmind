import { IsOptional, IsString } from 'class-validator';

export class ConnectDevAccountDto {
  @IsOptional()
  @IsString()
  pageName?: string;

  @IsOptional()
  @IsString()
  platformAccountId?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
