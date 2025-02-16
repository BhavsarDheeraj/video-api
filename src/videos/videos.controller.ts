import { Controller, Post, UseInterceptors, UploadedFile, Res, BadRequestException, UsePipes } from '@nestjs/common';
import { VideosService } from './videos.service';
import { Response } from 'express';
import { VideoUploadInterceptor } from './interceptors/file-upload.interceptor'; // Import the interceptor
import { FileValidationPipe } from './pipes/file-validation.pipe';

@Controller('videos')
export class VideosController {
  constructor(
    private readonly videosService: VideosService,
    ) {}

  @Post('upload')
  @UseInterceptors(VideoUploadInterceptor)
  @UsePipes(FileValidationPipe)
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      const video = await this.videosService.create({
        filename: file.filename,
        originalFilename: file.originalname,
        path: file.path,
        size: file.size,
        duration: 0,
      });

      return res.status(201).json({
        message: 'File uploaded successfully',
        data: video,
      });
    } catch (error) {
        console.error("upload error", error);
        return res.status(500).json({ message: 'Failed to upload video' });
    }
  }
}