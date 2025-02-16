import { VideosModule } from './videos.module';
import { RequestMethod } from '@nestjs/common';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ShareLinkMiddleware } from '../middleware/share-link.middleware';

describe('VideosModule - Middleware Configuration', () => {
  let videosModule: VideosModule;
  let consumer: any;
  let builder: any;

  beforeEach(() => {
    builder = {
      exclude: jest.fn().mockReturnThis(),
      forRoutes: jest.fn().mockReturnThis(),
    };

    consumer = {
      apply: jest.fn(() => builder),
    };

    videosModule = new VideosModule();
  });

  it('should configure AuthMiddleware and ShareLinkMiddleware correctly', () => {
    videosModule.configure(consumer);

    expect(consumer.apply).toHaveBeenCalledWith(AuthMiddleware);
    expect(builder.exclude).toHaveBeenCalledWith({
      path: 'videos/shared/:token',
      method: RequestMethod.GET,
    });
    expect(builder.forRoutes).toHaveBeenCalledWith('videos');

    expect(consumer.apply).toHaveBeenCalledWith(ShareLinkMiddleware);
    expect(builder.forRoutes).toHaveBeenCalledWith({
      path: 'videos/shared/:token',
      method: RequestMethod.GET,
    });
  });
});
