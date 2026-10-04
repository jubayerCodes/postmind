import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, Store } from '@prisma/client';

@Controller('stores')
@UseGuards(SupabaseAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createStoreDto: CreateStoreDto,
  ): Promise<Store> {
    return this.storesService.createStore(user.id, createStoreDto);
  }

  @Get()
  async findAll(@CurrentUser() user: User): Promise<Store[]> {
    return this.storesService.findUserStores(user.id);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<Store> {
    return this.storesService.findStoreById(id, user.id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
  ): Promise<Store> {
    return this.storesService.updateStore(id, user.id, updateStoreDto);
  }
}
