import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';

@Controller('storage')
@UseGuards(SupabaseAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.match(/^image\/(png|jpe?g|webp|gif)$/i)) {
          return callback(
            new BadRequestException(
              'Only image files (png, jpg, jpeg, webp, gif) are permitted',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please provide an image file');
    }
    return this.storageService.uploadProductImage(file);
  }
}
