import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssetsService } from '../assets/assets.service';

// Ensure uploads directory exists
const uploadsPath = join(process.cwd(), 'uploads');
if (!existsSync(uploadsPath)) {
  mkdirSync(uploadsPath, { recursive: true });
}

@Controller('uploads')
export class UploadsController {
  constructor(private assetsService: AssetsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsPath,
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase();
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          return callback(new BadRequestException('Only image files are allowed (JPG, PNG, WebP)'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB limit
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const asset = await this.assetsService.create(`/uploads/${file.filename}`);
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      fileType: file.mimetype,
      fileSize: file.size,
      assetId: asset.id,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsPath,
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase();
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMimes = ['video/mp4', 'video/webm'];
        if (!allowedMimes.includes(file.mimetype)) {
          return callback(new BadRequestException('Only video files are allowed (MP4, WebM)'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB limit
      },
    }),
  )
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const asset = await this.assetsService.create(`/uploads/${file.filename}`);
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      fileType: file.mimetype,
      fileSize: file.size,
      assetId: asset.id,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('audio')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsPath,
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase();
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/wav', 'audio/ogg'];
        if (!allowedMimes.includes(file.mimetype)) {
          return callback(new BadRequestException('Only audio files are allowed (MP3, WebM, WAV, OGG)'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB limit
      },
    }),
  )
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const asset = await this.assetsService.create(`/uploads/${file.filename}`);
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      fileType: file.mimetype,
      fileSize: file.size,
      assetId: asset.id,
    };
  }
}
