import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { Content, ContentStatus, ContentTone, PostType, Prisma } from '@prisma/client';

const contentInclude = {
  product: {
    select: {
      id: true,
      name: true,
      image: true,
      price: true,
      currency: true,
      category: true,
      tagline: true,
      features: true,
      discount: true,
    },
  },
  attachedProducts: {
    orderBy: { order: 'asc' as const },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          image: true,
          price: true,
          currency: true,
          category: true,
          tagline: true,
          features: true,
          discount: true,
        },
      },
    },
  },
};

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: string, dto: CreateContentDto): Promise<Content> {
    const rawIds = dto.productIds ?? (dto.productId ? [dto.productId] : []);
    const productIds = Array.from(new Set(rawIds.filter(Boolean)));

    if (productIds.length > 0) {
      const validCount = await this.prisma.product.count({
        where: { id: { in: productIds }, storeId, isArchived: false },
      });
      if (validCount !== productIds.length) {
        throw new BadRequestException('One or more attached products do not exist in this store');
      }
    }

    const primaryProductId = productIds[0] || null;

    return this.prisma.$transaction(async (tx) => {
      const content = await tx.content.create({
        data: {
          storeId,
          productId: primaryProductId,
          headline: dto.headline,
          caption: dto.caption,
          hashtags: dto.hashtags ?? [],
          cta: dto.cta,
          postType: dto.postType ?? PostType.PRODUCT_SHOWCASE,
          tone: dto.tone ?? ContentTone.NATURAL,
          status: dto.status ?? ContentStatus.READY,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
          language: dto.language ?? 'en',
        },
      });

      if (productIds.length > 0) {
        await tx.contentProduct.createMany({
          data: productIds.map((pId, idx) => ({
            contentId: content.id,
            productId: pId,
            order: idx,
          })),
        });
      }

      return tx.content.findUniqueOrThrow({
        where: { id: content.id },
        include: contentInclude,
      });
    });
  }

  async findAll(
    storeId: string,
    query: QueryContentDto,
  ): Promise<{ contents: Content[]; total: number }> {
    const where: Prisma.ContentWhereInput = { storeId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.productId) {
      where.OR = [
        { productId: query.productId },
        { attachedProducts: { some: { productId: query.productId } } },
      ];
    }

    const [contents, total] = await this.prisma.$transaction([
      this.prisma.content.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { createdAt: 'desc' },
        include: contentInclude,
      }),
      this.prisma.content.count({ where }),
    ]);

    return { contents, total };
  }

  async findOne(storeId: string, id: string): Promise<Content> {
    const content = await this.prisma.content.findFirst({
      where: { id, storeId },
      include: contentInclude,
    });

    if (!content) {
      throw new NotFoundException(`Content post with ID '${id}' not found in this store`);
    }

    return content;
  }

  async update(
    storeId: string,
    id: string,
    dto: UpdateContentDto,
  ): Promise<Content> {
    const existing = await this.findOne(storeId, id);

    if (existing.status === ContentStatus.PUBLISHED) {
      if (
        dto.headline !== undefined ||
        dto.caption !== undefined ||
        dto.hashtags !== undefined ||
        dto.cta !== undefined ||
        dto.productIds !== undefined
      ) {
        throw new BadRequestException(
          'Published posts cannot be edited. Content is already live on Facebook.',
        );
      }
    }

    const data: Prisma.ContentUpdateInput = {};
    if (dto.headline !== undefined) data.headline = dto.headline;
    if (dto.caption !== undefined) data.caption = dto.caption;
    if (dto.hashtags !== undefined) data.hashtags = dto.hashtags;
    if (dto.cta !== undefined) data.cta = dto.cta;
    if (dto.postType !== undefined) data.postType = dto.postType;
    if (dto.tone !== undefined) data.tone = dto.tone;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.language !== undefined) data.language = dto.language;
    if (dto.scheduledAt !== undefined) {
      data.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.productIds !== undefined) {
        const productIds = Array.from(new Set(dto.productIds.filter(Boolean)));
        if (productIds.length > 0) {
          const validCount = await tx.product.count({
            where: { id: { in: productIds }, storeId, isArchived: false },
          });
          if (validCount !== productIds.length) {
            throw new BadRequestException('One or more attached products do not exist in this store');
          }
        }

        // Remove old attachments and add new ones
        await tx.contentProduct.deleteMany({
          where: { contentId: id },
        });

        if (productIds.length > 0) {
          await tx.contentProduct.createMany({
            data: productIds.map((pId, idx) => ({
              contentId: id,
              productId: pId,
              order: idx,
            })),
          });
        }

        if (productIds[0]) {
          data.product = { connect: { id: productIds[0] } };
        } else {
          data.product = { disconnect: true };
        }
      }

      return tx.content.update({
        where: { id },
        data,
        include: contentInclude,
      });
    });
  }

  async remove(storeId: string, id: string): Promise<Content> {
    const existing = await this.findOne(storeId, id);

    if (existing.status === ContentStatus.PUBLISHED) {
      throw new BadRequestException(
        'Published posts cannot be deleted as they are already live on Facebook.',
      );
    }

    return this.prisma.content.delete({
      where: { id },
    });
  }

  async removeMany(storeId: string, ids: string[]): Promise<{ count: number }> {
    if (!ids || ids.length === 0) {
      return { count: 0 };
    }

    // Never delete published posts
    const nonPublished = await this.prisma.content.findMany({
      where: {
        id: { in: ids },
        storeId,
        status: { not: ContentStatus.PUBLISHED },
      },
      select: { id: true },
    });

    const targetIds = nonPublished.map((p) => p.id);
    if (targetIds.length === 0) {
      return { count: 0 };
    }

    const result = await this.prisma.content.deleteMany({
      where: {
        id: { in: targetIds },
        storeId,
      },
    });

    return { count: result.count };
  }
}
