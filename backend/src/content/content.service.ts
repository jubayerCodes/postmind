import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { Content, ContentStatus, ContentTone, PostType, Prisma } from '@prisma/client';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: string, dto: CreateContentDto): Promise<Content> {
    return this.prisma.content.create({
      data: {
        storeId,
        productId: dto.productId || null,
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
      include: {
        product: true,
      },
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
      where.productId = query.productId;
    }

    const [contents, total] = await this.prisma.$transaction([
      this.prisma.content.findMany({
        where,
        take: query.limit,
        skip: query.offset,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
              price: true,
              category: true,
            },
          },
        },
      }),
      this.prisma.content.count({ where }),
    ]);

    return { contents, total };
  }

  async findOne(storeId: string, id: string): Promise<Content> {
    const content = await this.prisma.content.findFirst({
      where: { id, storeId },
      include: {
        product: true,
      },
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
        dto.cta !== undefined
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

    return this.prisma.content.update({
      where: { id },
      data,
      include: {
        product: true,
      },
    });
  }

  async remove(storeId: string, id: string): Promise<Content> {
    await this.findOne(storeId, id);

    return this.prisma.content.delete({
      where: { id },
    });
  }
}
