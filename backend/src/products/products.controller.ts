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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { BulkCreateProductsDto } from './dto/bulk-create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { StoreTenantGuard } from '../common/guards/store-tenant.guard';
import { Product } from '@prisma/client';

@Controller('stores/:storeId/products')
@UseGuards(SupabaseAuthGuard, StoreTenantGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(
    @Param('storeId') storeId: string,
    @Body() createProductDto: CreateProductDto,
  ): Promise<Product> {
    return this.productsService.create(storeId, createProductDto);
  }

  @Post('bulk')
  async bulkCreate(
    @Param('storeId') storeId: string,
    @Body() bulkDto: BulkCreateProductsDto,
  ): Promise<{ count: number; products: Product[] }> {
    return this.productsService.bulkCreate(storeId, bulkDto);
  }

  @Get()
  async findAll(
    @Param('storeId') storeId: string,
    @Query() query: QueryProductDto,
  ): Promise<{ products: Product[]; total: number }> {
    return this.productsService.findAll(storeId, query);
  }

  @Get(':id')
  async findOne(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
  ): Promise<Product> {
    return this.productsService.findOne(storeId, id);
  }

  @Patch(':id')
  async update(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(storeId, id, updateProductDto);
  }

  @Delete(':id')
  async remove(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
  ): Promise<Product> {
    return this.productsService.remove(storeId, id);
  }
}
