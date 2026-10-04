import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ContentGeneratorService } from './generator/content-generator.service';
import { GeneratePostDto } from './generator/dto/generate-post.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { StoreTenantGuard } from '../common/guards/store-tenant.guard';
import { SocialPostOutput } from './generator/schemas/social-post-output.schema';
import { Content } from '@prisma/client';

@Controller('stores/:storeId/ai')
@UseGuards(SupabaseAuthGuard, StoreTenantGuard)
export class AiController {
  constructor(
    private readonly contentGeneratorService: ContentGeneratorService,
  ) {}

  @Post('generate-post')
  async generatePost(
    @Param('storeId') storeId: string,
    @Body() dto: GeneratePostDto,
  ): Promise<{ content: Content; aiOutput: SocialPostOutput }> {
    return this.contentGeneratorService.generatePost(storeId, dto);
  }
}
