import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Product, Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: string, dto: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({
      data: {
        storeId,
        name: dto.name,
        price: new Prisma.Decimal(dto.price),
        currency: dto.currency ?? 'BDT',
        category: dto.category ?? 'General',
        stock: dto.stock ?? 0,
        image: dto.image,
        tagline: dto.tagline,
        features: dto.features ?? [],
        discount: dto.discount,
      },
    });
  }

  async findAll(
    storeId: string,
    query: QueryProductDto,
  ): Promise<{ products: Product[]; total: number }> {
    const where: Prisma.ProductWhereInput = {
      storeId,
      isArchived: false,
    };

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { tagline: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  async findOne(storeId: string, id: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { id, storeId, isArchived: false },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found in this store`);
    }

    return product;
  }

  async update(
    storeId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    await this.findOne(storeId, id);

    const data: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.stock !== undefined) data.stock = dto.stock;
    if (dto.image !== undefined) data.image = dto.image;
    if (dto.tagline !== undefined) data.tagline = dto.tagline;
    if (dto.features !== undefined) data.features = dto.features;
    if (dto.discount !== undefined) data.discount = dto.discount;
    if (dto.isArchived !== undefined) data.isArchived = dto.isArchived;

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async remove(storeId: string, id: string): Promise<Product> {
    await this.findOne(storeId, id);

    // Soft delete to preserve post history and analytics
    return this.prisma.product.update({
      where: { id },
      data: { isArchived: true },
    });
  }
}
