import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { StoresService } from '../stores/stores.service';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
@UseGuards(SupabaseAuthGuard)
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storesService: StoresService,
  ) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.usersService.findById(user.id);
    const stores = await this.storesService.findUserStores(user.id, user.storeName);

    return {
      user: profile || user,
      stores,
    };
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }
}
