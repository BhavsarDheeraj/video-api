import * as ffmpeg from 'fluent-ffmpeg';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FfmpegUtil {
  getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.error('Error probing video:', err);
          reject(err);
          return;
        }
        resolve(Math.ceil(metadata.format.duration * 1000));
      });
    });
  }

  trimVideo(
    inputFile: string,
    outputFile: string,
    startTime: number,
    duration: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputFile)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(outputFile)
        .on('end', () => {
          resolve();
        })
        .on('error', (err) => {
          console.error('Error trimming video:', err);
          reject(err);
        })
        .run();
    });
  }

  mergeVideos(inputFiles: string[], outputFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const merger = ffmpeg();
      inputFiles.forEach((file) => {
        merger.addInput(file);
      });
      merger.mergeToFile(outputFile).on('end', resolve).on('error', reject);
    });
  }
}
