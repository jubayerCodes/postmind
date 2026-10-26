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

  async findUserStores(
    userId: string,
    preferredStoreName?: string,
  ): Promise<(Store & { _count: { products: number; contents: number } })[]> {
    let stores = await this.prisma.store.findMany({
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

    if (stores.length === 0) {
      const isDevMerchant =
        userId === 'dev-merchant-urbanwear' || userId === 'test-merchant-dhaka';

      if (preferredStoreName?.trim() || isDevMerchant) {
        const defaultStore = await this.autoProvisionDefaultStore(userId, preferredStoreName);
        stores = [defaultStore];
      }
    }

    return stores;
  }

  private async autoProvisionDefaultStore(
    userId: string,
    preferredStoreName?: string,
  ): Promise<Store & { _count: { products: number; contents: number } }> {
    const isDevMerchant =
      userId === 'dev-merchant-urbanwear' || userId === 'test-merchant-dhaka';
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    let storeName = preferredStoreName?.trim() || 'My Store';
    if (isDevMerchant) {
      storeName = 'UrbanWear Dhaka';
    }

    const baseSlug = slugify(storeName, { lower: true, strict: true }) || 'store';
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    const store = await this.prisma.store.create({
      data: {
        name: storeName,
        slug,
        currency: 'BDT',
        timezone: 'Asia/Dhaka',
        ownerId: userId,
      },
    });

    // Seed mock products ONLY for development/demo guest mode
    if (isDevMerchant) {
      await this.prisma.product.createMany({
        data: [
          {
            storeId: store.id,
            name: 'Premium Cotton Panjabi',
            price: 3250,
            currency: 'BDT',
            category: 'Apparel',
            stock: 50,
            image:
              'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=800&auto=format&fit=crop&q=80',
            tagline: 'Handcrafted luxury cotton for festive celebrations',
            features: ['100% Organic Combed Cotton', 'Breathable Weave'],
            discount: '20% OFF',
          },
          {
            storeId: store.id,
            name: 'Apex AirStride Performance Runner',
            price: 4950,
            currency: 'BDT',
            category: 'Footwear',
            stock: 22,
            image:
              'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
            tagline: 'Ultralight responsive nitrogen-cushioned running sneaker',
            features: ['Nitrogen-Infused Midsole', 'Breathable Mesh'],
            discount: 'Eid Special 20% OFF',
          },
          {
            storeId: store.id,
            name: 'Vintage Selvedge Raw Denim Jacket',
            price: 4200,
            currency: 'BDT',
            category: 'Apparel',
            stock: 18,
            image:
              'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
            tagline: 'Authentic 14oz ring-spun Japanese selvedge denim',
            features: ['14oz Raw Selvedge Denim', 'Custom Brass Rivets'],
            discount: null,
          },
          {
            storeId: store.id,
            name: 'Horween Chronograph Leather Watch',
            price: 6500,
            currency: 'BDT',
            category: 'Accessories',
            stock: 12,
            image:
              'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
            tagline: 'Sapphire crystal dial with handcrafted Horween leather strap',
            features: ['Sapphire Glass', 'Japanese Quartz'],
            discount: 'Limited Stock',
          },
        ],
      });
    }

    return (await this.prisma.store.findUnique({
      where: { id: store.id },
      include: {
        _count: {
          select: {
            products: true,
            contents: true,
          },
        },
      },
    }))!;
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
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
      },
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
}
