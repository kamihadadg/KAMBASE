import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class FileUploadService {
  private readonly uploadPath = './uploads';

  constructor() {
    this.ensureUploadDirectoryExists();
  }

  private async ensureUploadDirectoryExists() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  getMulterConfig() {
    return {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, this.uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Allow images and documents
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    };
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = join(this.uploadPath, filename);
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Failed to delete file ${filename}:`, error);
    }
  }

  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}
