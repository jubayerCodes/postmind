import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class StoreTenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User | undefined;

    if (!user) {
      throw new UnauthorizedException('Authentication required to verify store ownership');
    }

    // Extract storeId from route params, query, or header
    const storeId =
      request.params?.storeId ||
      request.params?.id ||
      request.query?.storeId ||
      request.headers['x-store-id'];

    if (!storeId || typeof storeId !== 'string') {
      return true; // No store parameter targeted in this context
    }

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID '${storeId}' not found`);
    }

    if (store.ownerId !== user.id) {
      throw new ForbiddenException('Access denied: You do not have ownership of this store');
    }

    request.store = store;
    return true;
  }
}
