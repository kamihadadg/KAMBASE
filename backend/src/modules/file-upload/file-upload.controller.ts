import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { FileUploadService } from './file-upload.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('file-upload')
@Controller('upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: async (req: any, file, cb) => {
        const userId = req.user?.userId;
        const uploadService = new FileUploadService();
        const destPath = uploadService.getUserUploadPath(userId);
        await uploadService.ensureUploadDirectoryExists(destPath);

        cb(null, destPath);
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
  }))
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user?.userId;

    return {
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      url: this.fileUploadService.getFileUrl(file.filename, userId),
    };
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 5, {
    storage: diskStorage({
      destination: async (req: any, file, cb) => {
        const userId = req.user?.userId;
        const uploadService = new FileUploadService();
        const destPath = uploadService.getUserUploadPath(userId);
        await uploadService.ensureUploadDirectoryExists(destPath);

        cb(null, destPath);
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
  }))
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Files to upload',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  uploadFiles(@UploadedFiles() files: Express.Multer.File[], @Request() req) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const userId = req.user?.userId;

    return files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      url: this.fileUploadService.getFileUrl(file.filename, userId),
    }));
  }
}
