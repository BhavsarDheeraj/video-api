import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile, ParseFilePipe } from '@nestjs/common';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}
}