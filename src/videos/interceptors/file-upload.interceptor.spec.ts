import { VideosService } from '../videos.service';
import { ConfigService } from '@nestjs/config';
import { Observable, of } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoUploadInterceptor } from './file-upload.interceptor';

jest.mock('@nestjs/platform-express', () => ({
  FileInterceptor: jest.fn(() => {
    return class DummyInterceptor {
      intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle();
      }
    };
  }),
}));

describe('VideoUploadInterceptor', () => {
  let interceptor: VideoUploadInterceptor;
  let videosService: Partial<VideosService>;
  let configService: Partial<ConfigService>;
  let executionContext: ExecutionContext;
  let callHandler: CallHandler;

  beforeEach(() => {
    videosService = {
      generateFilename: jest.fn(
        (originalName: string) => 'generatedFilename.mp4',
      ),
    };
    configService = {} as ConfigService;
    interceptor = new VideoUploadInterceptor(
      videosService as VideosService,
      configService as ConfigService,
    );

    executionContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as any;

    callHandler = {
      handle: jest.fn(() => of('success')),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call FileInterceptor with correct parameters', () => {
    interceptor.intercept(executionContext, callHandler);
    expect(FileInterceptor).toHaveBeenCalledWith(
      'file',
      expect.objectContaining({
        storage: expect.objectContaining({
          getDestination: expect.any(Function),
          getFilename: expect.any(Function),
        }),
      }),
    );
  });

  it('should use videosService.generateFilename in the filename function', () => {
    interceptor.intercept(executionContext, callHandler);
    const fileInterceptorCallArgs = (FileInterceptor as jest.Mock).mock
      .calls[0];
    const options = fileInterceptorCallArgs[1];

    expect(options.storage).toBeDefined();
    expect(typeof options.storage.getFilename).toBe('function');

    const dummyFile = { originalname: 'test.mp4' };
    const cb = jest.fn();
    options.storage.getFilename({}, dummyFile, cb);

    expect(videosService.generateFilename).toHaveBeenCalledWith('test.mp4');
    expect(cb).toHaveBeenCalledWith(null, 'generatedFilename.mp4');
  });

  it('should return the result from the inner interceptor', (done) => {
    const observable = interceptor.intercept(executionContext, callHandler);
    observable.subscribe((result) => {
      expect(result).toEqual('success');
      done();
    });
  });
});
