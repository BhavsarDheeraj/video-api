import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  private readonly logFilePath = path.join(process.cwd(), 'access.log');
  private readonly maxBodyLogSize = 1024;

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const requestId = uuidv4();

    const getSafeRequestBody = (): string => {
      try {
        if (req.method === 'GET') return '';
        if (!req.body) return '';

        const requestBodyString = JSON.stringify(req.body);
        if (requestBodyString.length > this.maxBodyLogSize) {
          return `(Request body too large - ${requestBodyString.length} bytes - Truncated)`;
        }

        return requestBodyString;
      } catch (error) {
        return `(Error parsing request body: ${error.message})`;
      }
    };

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const responseTime = Date.now() - req['start'];

      const logMessage = `${requestId} - ${ip} - ${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} - ${responseTime}ms - Body: ${getSafeRequestBody()}\n`;

      fs.appendFile(this.logFilePath, logMessage, (err) => {
        if (err) {
          console.error(`Error writing to log file:`, err);
        }
      });

      this.logger.log(logMessage.trim());
    });

    req['start'] = Date.now();
    next();
  }
}
