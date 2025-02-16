import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Video {
  @ApiProperty({
    description: 'Unique video ID (UUID)',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Filename on server',
    example: 'random-filename.mp4',
  })
  @Column()
  filename: string;

  @ApiProperty({ description: 'Original filename', example: 'my-video.mp4' })
  @Column()
  originalFilename: string;

  @ApiProperty({
    description: 'File path on server',
    example: './storage/random-filename.mp4',
  })
  @Column()
  path: string;

  @ApiProperty({
    description: 'Video duration in milliseconds',
    example: 120000,
  })
  @Column({ type: 'bigint' })
  duration: number;

  @ApiProperty({ description: 'File size in bytes', example: 5242880 })
  @Column({ type: 'bigint' })
  size: number;

  @ApiProperty({
    description: 'Share link token (if shared)',
    example: 'share-token-string',
    nullable: true,
  })
  @Column({ nullable: true })
  shareLink?: string;

  @ApiProperty({
    description: 'Share link expiry timestamp (milliseconds, Unix epoch)',
    example: 1678886400000,
    nullable: true,
  })
  @Column({ type: 'bigint', nullable: true })
  shareLinkExpiry?: number;

  @ApiProperty({ description: 'Creation timestamp', type: Date })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', type: Date })
  @UpdateDateColumn()
  updatedAt: Date;
}
