import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL', 'https://placeholder.supabase.co');
    const supabaseKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_ANON_KEY', 'placeholder');
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async validateToken(token: string): Promise<User> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Invalid or expired Supabase authentication token');
    }

    const name =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      undefined;
    const rawPicture =
      user.user_metadata?.avatar_url || user.user_metadata?.picture;
    const avatarUrl =
      typeof rawPicture === 'string'
        ? rawPicture
        : typeof rawPicture === 'object' &&
          rawPicture !== null &&
          'data' in rawPicture &&
          typeof (rawPicture as any).data?.url === 'string'
        ? (rawPicture as any).data.url
        : undefined;

    const userEntity = await this.usersService.findOrCreateUser({
      id: user.id,
      email: user.email ?? `${user.id}@postmind.local`,
      name,
      avatarUrl,
    });

    const storeName =
      (user.user_metadata?.store_name as string) ||
      (user.user_metadata?.storeName as string) ||
      undefined;

    return Object.assign(userEntity, { storeName });
  }

  async getDevUser(devUserId: string): Promise<User> {
    return this.usersService.findOrCreateUser({
      id: devUserId,
      email: `${devUserId}@postmind.local`,
      name: 'UrbanWear Merchant',
    });
  }
}
