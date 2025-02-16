import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { VideosService } from '../videos/videos.service';

@Injectable()
export class ShareLinkMiddleware implements NestMiddleware {
  constructor(private readonly videosService: VideosService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.params.token;

    if (!token) {
      throw new UnauthorizedException('Share link token is required');
    }

    next();
  }
}
