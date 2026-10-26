import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucketName = 'product-images';
  private bucketChecked = false;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>(
      'SUPABASE_URL',
      'https://rqcaoksdmazghdccaybv.supabase.co',
    );
    const serviceRoleKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_ANON_KEY', '');

    this.supabase = createClient(supabaseUrl, serviceRoleKey);
  }

  private async ensureBucketExists(): Promise<void> {
    if (this.bucketChecked) return;
    try {
      const { data: buckets, error } =
        await this.supabase.storage.listBuckets();
      if (error) {
        this.logger.warn(`Could not list buckets: ${error.message}`);
        return;
      }

      const exists = buckets?.some((b) => b.name === this.bucketName);
      if (!exists) {
        const { error: createError } =
          await this.supabase.storage.createBucket(this.bucketName, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: [
              'image/png',
              'image/jpeg',
              'image/jpg',
              'image/webp',
              'image/gif',
            ],
          });
        if (createError) {
          this.logger.warn(
            `Failed to create bucket ${this.bucketName}: ${createError.message}`,
          );
        } else {
          this.logger.log(`Created public bucket '${this.bucketName}'`);
        }
      }
      this.bucketChecked = true;
    } catch (err: any) {
      this.logger.warn(`Bucket check failed: ${err.message}`);
    }
  }

  async uploadProductImage(
    file: Express.Multer.File,
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    await this.ensureBucketExists();

    const timestamp = Date.now();
    const cleanName = (file.originalname || 'upload.png')
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-');
    const path = `catalog/${timestamp}-${cleanName}`;

    const { error: uploadError } = await this.supabase.storage
      .from(this.bucketName)
      .upload(path, file.buffer, {
        contentType: file.mimetype || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      this.logger.error(`Supabase upload failed: ${uploadError.message}`);
      throw new BadRequestException(
        `Failed to upload image: ${uploadError.message}`,
      );
    }

    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);

    return {
      url: data.publicUrl,
      key: path,
    };
  }

  async uploadBase64Image(
    base64DataUri: string,
    filename = 'generated-product.jpg',
  ): Promise<{ url: string; key: string }> {
    if (!base64DataUri) {
      throw new BadRequestException('No base64 image data provided');
    }

    await this.ensureBucketExists();

    const matches = base64DataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let buffer: Buffer;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64DataUri, 'base64');
    }

    const timestamp = Date.now();
    const cleanName = filename.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
    const path = `catalog/${timestamp}-${cleanName}`;

    const { error: uploadError } = await this.supabase.storage
      .from(this.bucketName)
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      this.logger.error(`Supabase base64 upload failed: ${uploadError.message}`);
      throw new BadRequestException(
        `Failed to upload generated image: ${uploadError.message}`,
      );
    }

    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);

    return {
      url: data.publicUrl,
      key: path,
    };
  }
}
