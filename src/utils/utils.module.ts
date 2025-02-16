import { Module } from '@nestjs/common';
import { FfmpegUtil } from './ffmpeg.util';

@Module({
  providers: [FfmpegUtil],
  exports: [FfmpegUtil],
})
export class UtilsModule {}
