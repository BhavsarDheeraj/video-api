import { Test, TestingModule } from '@nestjs/testing';
import { UtilsModule } from './utils.module';
import { FfmpegUtil } from './ffmpeg.util';

describe('UtilsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [UtilsModule],
    }).compile();
  });

  it('should provide FfmpegUtil', () => {
    const ffmpegUtil = module.get<FfmpegUtil>(FfmpegUtil);
    expect(ffmpegUtil).toBeDefined();
  });
});
