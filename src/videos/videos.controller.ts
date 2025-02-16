import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Res,
  Body,
  BadRequestException,
  UsePipes,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { Response } from 'express';
import { VideoUploadInterceptor } from './interceptors/file-upload.interceptor';
import { TrimVideoDto } from './dto/trim-video.dto';
import { MergeVideosDto } from './dto/merge-videos.dto';
import { ValidationPipe } from '@nestjs/common';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import { NotFoundException } from '@nestjs/common';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

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
      console.error('upload error', error);
      return res.status(500).json({ message: 'Failed to upload video' });
    }
  }

  @Post('trim')
  @UsePipes(new ValidationPipe({ transform: true }))
  async trimVideo(@Body() trimVideoDto: TrimVideoDto, @Res() res: Response) {
    try {
      const { id, startTime, endTime } = trimVideoDto;
      if (startTime >= endTime) {
        throw new BadRequestException(
          'Start time cannot be greater or equal to end time.',
        );
      }
      const trimmedVideo = await this.videosService.trim(
        id,
        startTime,
        endTime,
      );
      return res.status(201).json({
        message: 'Video trimmed successfully',
        data: trimmedVideo,
      });
    } catch (error) {
      console.error('trimVideo error', error);
      if (error instanceof NotFoundException) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to trim video' });
    }
  }

  @Post('merge')
  @UsePipes(new ValidationPipe({ transform: true }))
  async mergeVideos(
    @Body() mergeVideosDto: MergeVideosDto,
    @Res() res: Response,
  ) {
    try {
      const { videoIds } = mergeVideosDto;
      const mergedVideo = await this.videosService.merge(videoIds);
      return res.status(201).json({
        message: 'Videos merged successfully',
        data: mergedVideo,
      });
    } catch (error) {
      console.error('merge video error', error);
      if (error instanceof NotFoundException) {
        return res.status(404).json({ message: error.message });
      } else if (error instanceof BadRequestException) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to merge videos' });
    }
  }
}
