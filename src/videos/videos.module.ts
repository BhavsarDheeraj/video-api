import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ShareLinkMiddleware } from '../middleware/share-link.middleware';

@Module({
  imports: [TypeOrmModule.forFeature([Video])],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({ path: 'videos/shared/:token', method: RequestMethod.GET })
      .forRoutes('videos');

    consumer
      .apply(ShareLinkMiddleware)
      .forRoutes({ path: 'videos/shared/:token', method: RequestMethod.GET });
  }
}
