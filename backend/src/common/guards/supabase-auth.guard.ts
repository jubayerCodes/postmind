import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    // Development bypass for immediate local testing without full Supabase UI login
    const devUserId = request.headers['x-dev-user-id'];
    const isDev = process.env.NODE_ENV !== 'production';

    if (!authHeader || typeof authHeader !== 'string') {
      if (isDev && devUserId && typeof devUserId === 'string') {
        const user = await this.authService.getDevUser(devUserId);
        request.user = user;
        return true;
      }
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      if (isDev && devUserId && typeof devUserId === 'string') {
        const user = await this.authService.getDevUser(devUserId);
        request.user = user;
        return true;
      }
      throw new UnauthorizedException('Invalid authorization scheme, expected Bearer token');
    }

    try {
      const user = await this.authService.validateToken(token);
      request.user = user;
      return true;
    } catch (err) {
      if (isDev && devUserId && typeof devUserId === 'string') {
        const user = await this.authService.getDevUser(devUserId);
        request.user = user;
        return true;
      }
      throw err;
    }
  }
}
