import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './entities/video.entity';
import * as ffmpeg from 'fluent-ffmpeg';
import { extname } from 'path';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
  ) {}

  generateFilename(originalname: string): string {
    const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
    return `${randomName}${extname(originalname)}`;
  }

  async create(fileData: Partial<Video>): Promise<Video> {
        const newVideo = this.videoRepository.create(fileData);
        const savedVideo = await this.videoRepository.save(newVideo);
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(savedVideo.path, (err, metadata) => {
                if (err) {
                    console.error("Error probing video:", err);
                    resolve(savedVideo);
                    return;
                }
                savedVideo.duration = Math.ceil(metadata.format.duration * 1000);
                this.videoRepository.save(savedVideo)
                .then(updatedVideo => {
                    resolve(updatedVideo);
                }).catch(updateError => {
                    console.error("Error updating video duration:", updateError);
                    resolve(savedVideo)
                });
            });
        });
    }

  async trim(id: string, startTime: number, endTime: number): Promise<Video> {
    const video = await this.videoRepository.findOneBy({id});
    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }

    const inputFile = video.path;
    const outputFilename = this.generateFilename(`trimmed_${video.originalFilename}`);
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
}