import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ffmpeg from 'fluent-ffmpeg';
import { VideoDurationValidationPipe } from './video-duration.pipe';

describe('VideoDurationValidationPipe', () => {
  let pipe: VideoDurationValidationPipe;
  let configService: Partial<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue(30),
    };
    pipe = new VideoDurationValidationPipe(configService as ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return value if no file is provided', async () => {
    const result = await pipe.transform(
      null as unknown as Express.Multer.File,
      {} as any,
    );
    expect(result).toBeNull();
  });

  it('should resolve with file when ffprobe returns an error', async () => {
    const fakeFile = { path: 'fakePath' } as Express.Multer.File;
    const ffprobeSpy = jest
      .spyOn(ffmpeg, 'ffprobe')
      .mockImplementation((path, cb) => {
        cb(new Error('ffprobe error'), null);
      });

    const result = await pipe.transform(fakeFile, {} as any);
    expect(result).toEqual(fakeFile);
    expect(ffprobeSpy).toHaveBeenCalledWith(
      fakeFile.path,
      expect.any(Function),
    );
  });

  it('should resolve with file when video duration is within the allowed limit', async () => {
    const fakeFile = { path: 'fakePath' } as Express.Multer.File;
    const fakeMetadata = { format: { duration: 29 } };
    const ffprobeSpy = jest
      .spyOn(ffmpeg, 'ffprobe')
      .mockImplementation((path, cb) => {
        cb(null, fakeMetadata);
      });

    const result = await pipe.transform(fakeFile, {} as any);
    expect(result).toEqual(fakeFile);
    expect(ffprobeSpy).toHaveBeenCalledWith(
      fakeFile.path,
      expect.any(Function),
    );
  });

  it('should reject with BadRequestException when video duration exceeds the allowed limit', async () => {
    const fakeFile = { path: 'fakePath' } as Express.Multer.File;
    const fakeMetadata = { format: { duration: 31 } };
    const ffprobeSpy = jest
      .spyOn(ffmpeg, 'ffprobe')
      .mockImplementation((path, cb) => {
        cb(null, fakeMetadata);
      });

    await expect(pipe.transform(fakeFile, {} as any)).rejects.toThrow(
      new BadRequestException(
        'Video duration exceeds the maximum allowed duration of 30 seconds',
      ),
    );
    expect(ffprobeSpy).toHaveBeenCalledWith(
      fakeFile.path,
      expect.any(Function),
    );
  });
});
