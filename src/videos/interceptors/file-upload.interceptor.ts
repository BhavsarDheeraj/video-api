import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { VideosService } from '../videos.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VideoUploadInterceptor implements NestInterceptor {
  constructor(
    private readonly videosService: VideosService,
    private readonly configService: ConfigService,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const fileInterceptor = FileInterceptor('file', {
      storage: diskStorage({
        destination: './storage',
        filename: (req, file, cb) => {
          const filename = this.videosService.generateFilename(
            file.originalname,
          );
          cb(null, filename);
        },
      }),
    });

    const interceptor = new (fileInterceptor as any)();

    return interceptor.intercept(context, next);
  }
}
