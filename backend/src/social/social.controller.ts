import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SocialService } from './social.service';
import { ConnectDevAccountDto } from './dto/connect-dev-account.dto';
import { OAuthCallbackDto } from './dto/oauth-callback.dto';
import { PublishContentDto } from './dto/publish-content.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { StoreTenantGuard } from '../common/guards/store-tenant.guard';

@Controller('stores/:storeId/social')
@UseGuards(SupabaseAuthGuard, StoreTenantGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('connect-url')
  async getConnectUrl(
    @Param('storeId') storeId: string,
    @Query('redirectUri') redirectUri?: string,
  ) {
    return this.socialService.getConnectUrl(storeId, redirectUri);
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async handleCallback(
    @Param('storeId') storeId: string,
    @Body() dto: OAuthCallbackDto,
  ) {
    const accounts = await this.socialService.handleCallback(
      storeId,
      dto.code,
      dto.redirectUri,
    );
    return { accounts, count: accounts.length };
  }

  @Post('dev-connect')
  @HttpCode(HttpStatus.CREATED)
  async connectDevPage(
    @Param('storeId') storeId: string,
    @Body() dto: ConnectDevAccountDto,
  ) {
    const account = await this.socialService.connectDevPage(storeId, dto);
    return { account, message: 'Simulated Facebook Page connected successfully' };
  }

  @Get('accounts')
  async getAccounts(@Param('storeId') storeId: string) {
    const accounts = await this.socialService.getConnectedAccounts(storeId);
    return { accounts, count: accounts.length };
  }

  @Delete('accounts/:id')
  async disconnectAccount(
    @Param('storeId') storeId: string,
    @Param('id') accountId: string,
  ) {
    return this.socialService.disconnectAccount(storeId, accountId);
  }

  @Post('publish/:contentId')
  @HttpCode(HttpStatus.OK)
  async publishPost(
    @Param('storeId') storeId: string,
    @Param('contentId') contentId: string,
    @Body() dto: PublishContentDto,
  ) {
    return this.socialService.publishPost(
      storeId,
      contentId,
      dto?.socialAccountId,
    );
  }

  @Get('metrics/:contentId')
  async getPostMetrics(
    @Param('storeId') storeId: string,
    @Param('contentId') contentId: string,
  ) {
    return this.socialService.syncPostMetrics(storeId, contentId);
  }

  @Post('metrics/:contentId/sync')
  @HttpCode(HttpStatus.OK)
  async syncPostMetrics(
    @Param('storeId') storeId: string,
    @Param('contentId') contentId: string,
  ) {
    return this.socialService.syncPostMetrics(storeId, contentId);
  }
}
