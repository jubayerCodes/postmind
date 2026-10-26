import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContentGeneratorService } from './generator/content-generator.service';
import { AiController } from './ai.controller';
import { ProductsModule } from '../products/products.module';
import { StorageModule } from '../storage/storage.module';
import { AiImageService } from './image-generator/ai-image.service';
import { DocumentParserService } from './document-parser/document-parser.service';

@Module({
  imports: [ConfigModule, ProductsModule, StorageModule],
  controllers: [AiController],
  providers: [
    ContentGeneratorService,
    AiImageService,
    DocumentParserService,
  ],
  exports: [
    ContentGeneratorService,
    AiImageService,
    DocumentParserService,
  ],
})
export class AiModule {}
