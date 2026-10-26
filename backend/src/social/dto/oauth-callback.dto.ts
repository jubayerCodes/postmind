import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OAuthCallbackDto {
  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  redirectUri?: string;
}
