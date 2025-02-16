import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const apiKey = this.configService.get<string>('API_KEY');
    const providedApiKey = req.headers['x-api-key'];

    if (!providedApiKey || providedApiKey !== apiKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    next();
  }
}