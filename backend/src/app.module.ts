import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StoresModule } from './stores/stores.module';
import { ProductsModule } from './products/products.module';
import { AiModule } from './ai/ai.module';
import { ContentModule } from './content/content.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CryptoModule } from './common/crypto/crypto.module';
import { SocialModule } from './social/social.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CryptoModule,
    AuthModule,
    UsersModule,
    StoresModule,
    ProductsModule,
    AiModule,
    ContentModule,
    SocialModule,
    SchedulingModule,
    StorageModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
