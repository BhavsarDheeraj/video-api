import { ApiProperty } from '@nestjs/swagger';
import { Video } from '../entities/video.entity';

export class UploadVideoResponseDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ type: Video, description: 'Details of the uploaded video' })
  data: Video;
}

export class TrimVideoResponseDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ type: Video, description: 'Details of the trimmed video' })
  data: Video;
}

export class MergeVideosResponseDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ type: Video, description: 'Details of the merged video' })
  data: Video;
}

export class ShareVideoResponseDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Shareable link URL' })
  shareLink: string;

  @ApiProperty({ description: 'Share link expiry timestamp (milliseconds)' })
  expiry: number;
}
