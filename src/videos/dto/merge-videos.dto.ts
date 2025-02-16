import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, ArrayMinSize, IsUUID } from 'class-validator';

export class MergeVideosDto {
  @ApiProperty({
    description: 'Array of video IDs to merge (at least 2 UUIDs)',
    example: ['video-uuid-1', 'video-uuid-2'],
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('all', { each: true })
  videoIds: string[];
}
