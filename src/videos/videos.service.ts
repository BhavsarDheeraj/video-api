import {
  Injectable,
  NotFoundException,
  BadRequestException,
  StreamableFile,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Video } from './entities/video.entity';
import * as ffmpeg from 'fluent-ffmpeg';
import { extname, join } from 'path';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { createReadStream } from 'fs';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
    private readonly configService: ConfigService,
  ) {}

  generateFilename(originalname: string): string {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    return `${randomName}${extname(originalname)}`;
  }

  async create(fileData: Partial<Video>): Promise<Video> {
    const newVideo = this.videoRepository.create(fileData);
    const savedVideo = await this.videoRepository.save(newVideo);
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(savedVideo.path, (err, metadata) => {
        if (err) {
          console.error('Error probing video:', err);
          resolve(savedVideo);
          return;
        }
        savedVideo.duration = Math.ceil(metadata.format.duration * 1000);
        this.videoRepository
          .save(savedVideo)
          .then((updatedVideo) => {
            resolve(updatedVideo);
          })
          .catch((updateError) => {
            console.error('Error updating video duration:', updateError);
            resolve(savedVideo);
          });
      });
    });
  }

  async trim(id: string, startTime: number, endTime: number): Promise<Video> {
    const video = await this.videoRepository.findOneBy({ id });
    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }

    const inputFile = video.path;
    const outputFilename = this.generateFilename(
      `trimmed_${video.originalFilename}`,
    );
    const outputFile = `./storage/${outputFilename}`;
    const duration = endTime - startTime;

    return new Promise((resolve, reject) => {
      ffmpeg(inputFile)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(outputFile)
        .on('end', async () => {
          const trimmedVideo = await this.create({
            filename: outputFilename,
            originalFilename: video.originalFilename,
            path: outputFile,
            size: 0,
            duration: 0,
          });
          resolve(trimmedVideo);
        })
        .on('error', (err) => {
          console.error('Error trimming video:', err);
          reject(err);
        })
        .run();
    });
  }

  async merge(videoIds: string[]): Promise<Video> {
    if (!videoIds || videoIds.length === 0) {
      throw new BadRequestException('No video IDs provided for merging');
    }
    if (videoIds.length === 1) {
      throw new BadRequestException(
        'At least two videos are required to merge',
      );
    }

    const videos = await this.videoRepository.findBy({ id: In(videoIds) });

    if (videos.length !== videoIds.length) {
      const foundIds = videos.map((v) => v.id);
      const notFoundIds = videoIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Videos with IDs ${notFoundIds.join(', ')} not found`,
      );
    }

    const videoPaths = videos.map((video) => video.path);

    const outputFilename = this.generateFilename('merged_video.mp4');
    const outputFile = `./storage/${outputFilename}`;

    return new Promise((resolve, reject) => {
      const merger = ffmpeg();

      videoPaths.forEach((path) => {
        merger.addInput(path);
      });

      merger
        .mergeToFile(outputFile)
        .on('end', async () => {
          const mergedVideo = await this.create({
            filename: outputFilename,
            originalFilename: 'merged_video.mp4',
            path: outputFile,
            size: 0,
            duration: 0,
          });
          resolve(mergedVideo);
        })
        .on('error', (err) => {
          console.error('Error merging videos:', err);
          reject(err);
        });
    });
  }

  async generateShareLink(videoId: string): Promise<Video> {
    const video = await this.videoRepository.findOneBy({ id: videoId });
    if (!video) {
      throw new NotFoundException(`Video with ID ${videoId} not found`);
    }

    const token = uuidv4();
    const expiryTime =
      Date.now() +
      parseInt(this.configService.get('SHARE_EXPIRY_TIME', '3600')) * 1000;

    video.shareLink = token;
    video.shareLinkExpiry = expiryTime;

    return await this.videoRepository.save(video);
  }

  async streamVideo(videoId: string): Promise<StreamableFile> {
    const video = await this.videoRepository.findOneBy({ id: videoId });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const file = createReadStream(join(process.cwd(), video.path));
    return new StreamableFile(file);
  }

  async getVideoByShareLinkAndStream(
    token: string,
  ): Promise<{ video: Video; stream: StreamableFile }> {
    const video = await this.videoRepository.findOne({
      where: { shareLink: token },
    });
    if (!video) {
      throw new NotFoundException('Invalid share link');
    }

    if (video.shareLinkExpiry && video.shareLinkExpiry < Date.now()) {
      throw new UnauthorizedException('Share link has expired');
    }

    const fileStream = createReadStream(join(process.cwd(), video.path));
    return { video: video, stream: new StreamableFile(fileStream) };
  }
}
