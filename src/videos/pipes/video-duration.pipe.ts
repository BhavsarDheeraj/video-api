import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ffmpeg from 'fluent-ffmpeg';

@Injectable()
export class VideoDurationValidationPipe implements PipeTransform {
  constructor(private configService: ConfigService) {}

  async transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (!value) {
      return value;
    }

    const maxDuration = this.configService.get<number>(
      'MAX_DURATION_IN_SECONDS',
      30,
    );

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(value.path, (err, metadata) => {
        if (err) {
          console.error('ffprobe error:', err);
          resolve(value);
          return;
        }

        const durationInSeconds = Math.ceil(metadata.format.duration);

        if (durationInSeconds > maxDuration) {
          reject(
            new BadRequestException(
              `Video duration exceeds the maximum allowed duration of ${maxDuration} seconds`,
            ),
          );
        } else {
          resolve(value);
        }
      });
    });
  }
}
