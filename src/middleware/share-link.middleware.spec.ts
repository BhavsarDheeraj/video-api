import { UnauthorizedException } from '@nestjs/common';
import { VideosService } from '../videos/videos.service';
import { ShareLinkMiddleware } from './share-link.middleware';

describe('ShareLinkMiddleware', () => {
  let middleware: ShareLinkMiddleware;
  let videosService: VideosService;

  beforeEach(() => {
    videosService = {} as VideosService;
    middleware = new ShareLinkMiddleware(videosService);
  });

  it('should throw UnauthorizedException if token is missing', async () => {
    const req = { params: {} } as any;
    const res = {} as any;
    const next = jest.fn();

    await expect(middleware.use(req, res, next)).rejects.toThrowError(
      UnauthorizedException,
    );

    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if token is provided', async () => {
    const req = { params: { token: 'validToken' } } as any;
    const res = {} as any;
    const next = jest.fn();

    await middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
