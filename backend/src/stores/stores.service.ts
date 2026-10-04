import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from '@prisma/client';
import slugify from 'slugify';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async createStore(userId: string, dto: CreateStoreDto): Promise<Store> {
    const baseSlug = dto.slug
      ? slugify(dto.slug, { lower: true, strict: true })
      : slugify(dto.name, { lower: true, strict: true });

    let finalSlug = baseSlug;
    const existing = await this.prisma.store.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      finalSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    return this.prisma.store.create({
      data: {
        name: dto.name,
        slug: finalSlug,
        currency: dto.currency ?? 'BDT',
        timezone: dto.timezone ?? 'Asia/Dhaka',
        ownerId: userId,
      },
    });
  }

  async findUserStores(userId: string): Promise<Store[]> {
    return this.prisma.store.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            products: true,
            contents: true,
          },
        },
      },
    });
  }

  async findStoreById(storeId: string, userId: string): Promise<Store> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        _count: {
          select: {
            products: true,
            contents: true,
            socialAccounts: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID '${storeId}' not found`);
    }

    if (store.ownerId !== userId) {
      throw new ForbiddenException('Access denied: You do not have ownership of this store');
    }

    return store;
  }

  async updateStore(
    storeId: string,
    userId: string,
    dto: UpdateStoreDto,
  ): Promise<Store> {
    await this.findStoreById(storeId, userId);

    return this.prisma.store.update({
      where: { id: storeId },
      data: {
        name: dto.name,
        currency: dto.currency,
        timezone: dto.timezone,
      },
    });
  }
}
