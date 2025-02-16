import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ShareVideoDto {
  @ApiProperty({
    description: 'ID of the video to share',
    example: 'video-uuid-example',
  })
  @IsNotEmpty()
  @IsUUID()
  id: string;
}
