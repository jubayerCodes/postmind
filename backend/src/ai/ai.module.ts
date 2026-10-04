import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContentGeneratorService } from './generator/content-generator.service';
import { AiController } from './ai.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ConfigModule, ProductsModule],
  controllers: [AiController],
  providers: [ContentGeneratorService],
  exports: [ContentGeneratorService],
})
export class AiModule {}
