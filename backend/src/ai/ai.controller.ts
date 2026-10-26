import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContentGeneratorService } from './generator/content-generator.service';
import { GeneratePostDto } from './generator/dto/generate-post.dto';
import { RegeneratePostDto } from './generator/dto/regenerate-post.dto';
import { GenerateProductImageDto } from './image-generator/dto/generate-image.dto';
import { AiImageService } from './image-generator/ai-image.service';
import { DocumentParserService } from './document-parser/document-parser.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { StoreTenantGuard } from '../common/guards/store-tenant.guard';
import { SocialPostOutput } from './generator/schemas/social-post-output.schema';
import { Content } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('stores/:storeId/ai')
@UseGuards(SupabaseAuthGuard, StoreTenantGuard)
export class AiController {
  constructor(
    private readonly contentGeneratorService: ContentGeneratorService,
    private readonly aiImageService: AiImageService,
    private readonly documentParserService: DocumentParserService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('generate-post')
  async generatePost(
    @Param('storeId') storeId: string,
    @Body() dto: GeneratePostDto,
  ): Promise<{ content: Content; aiOutput: SocialPostOutput }> {
    return this.contentGeneratorService.generatePost(storeId, dto);
  }

  @Post('regenerate-post/:contentId')
  async regeneratePost(
    @Param('storeId') storeId: string,
    @Param('contentId') contentId: string,
    @Body() dto?: RegeneratePostDto,
  ): Promise<{ content: Content; aiOutput: SocialPostOutput }> {
    return this.contentGeneratorService.regeneratePost(storeId, contentId, dto);
  }

  @Post('generate-product-image')
  async generateProductImage(
    @Body() dto: GenerateProductImageDto,
  ) {
    return this.aiImageService.generateProductImage(dto);
  }

  @Post('regenerate-product-image')
  async regenerateProductImage(
    @Body() dto: GenerateProductImageDto,
  ) {
    return this.aiImageService.generateProductImage(dto);
  }

  @Post('parse-document')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
    }),
  )
  async parseDocument(
    @Param('storeId') storeId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Please provide a document or image file');
    }

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { currency: true },
    });

    return this.documentParserService.parseDocument(
      file,
      store?.currency || 'BDT',
    );
  }
}

