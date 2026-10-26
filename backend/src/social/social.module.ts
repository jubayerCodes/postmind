import { Module } from '@nestjs/common';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { MetaGraphService } from './meta/meta-graph.service';
import { CryptoModule } from '../common/crypto/crypto.module';

@Module({
  imports: [CryptoModule],
  controllers: [SocialController],
  providers: [SocialService, MetaGraphService],
  exports: [SocialService, MetaGraphService],
})
export class SocialModule {}
