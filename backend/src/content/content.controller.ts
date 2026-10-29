import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { StoreTenantGuard } from '../common/guards/store-tenant.guard';
import { Content } from '@prisma/client';

@Controller('stores/:storeId/contents')
@UseGuards(SupabaseAuthGuard, StoreTenantGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  async create(
    @Param('storeId') storeId: string,
    @Body() dto: CreateContentDto,
  ): Promise<Content> {
    return this.contentService.create(storeId, dto);
  }

  @Get()
  async findAll(
    @Param('storeId') storeId: string,
    @Query() query: QueryContentDto,
  ): Promise<{ contents: Content[]; total: number }> {
    return this.contentService.findAll(storeId, query);
  }

  @Get(':id')
  async findOne(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
  ): Promise<Content> {
    return this.contentService.findOne(storeId, id);
  }

  @Patch(':id')
  async update(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
  ): Promise<Content> {
    return this.contentService.update(storeId, id, dto);
  }

  @Post('bulk-delete')
  async removeMany(
    @Param('storeId') storeId: string,
    @Body('ids') ids: string[],
  ): Promise<{ count: number }> {
    return this.contentService.removeMany(storeId, ids || []);
  }

  @Delete(':id')
  async remove(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
  ): Promise<Content> {
    return this.contentService.remove(storeId, id);
  }
}
