import { IsNotEmpty, IsNumber, IsPositive, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TrimVideoDto {
  @ApiProperty({
    description: 'ID of the video to trim',
    example: 'video-uuid-example',
  })
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Start time for trim (seconds)', example: 10 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  startTime: number;

  @ApiProperty({
    description: 'End time for trim (seconds)',
    example: 30,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  endTime: number;
}
