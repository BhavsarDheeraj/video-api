import { Test } from '@nestjs/testing';
import { FfmpegUtil } from './ffmpeg.util';
import * as ffmpeg from 'fluent-ffmpeg';

jest.mock('fluent-ffmpeg');

describe('FfmpegUtil', () => {
  let ffmpegUtil: FfmpegUtil;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [FfmpegUtil],
    }).compile();

    ffmpegUtil = module.get<FfmpegUtil>(FfmpegUtil);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('getVideoDuration', () => {
    it('should return video duration in milliseconds', async () => {
      const mockDuration = 10.5;
      const expectedDurationMs = 10500;

      (ffmpeg.ffprobe as jest.Mock).mockImplementation((path, callback) => {
        callback(null, {
          format: {
            duration: mockDuration,
          },
        });
      });

      const duration = await ffmpegUtil.getVideoDuration('test-video.mp4');
      expect(duration).toBe(expectedDurationMs);
      expect(ffmpeg.ffprobe).toHaveBeenCalledWith(
        'test-video.mp4',
        expect.any(Function),
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should reject with error when ffprobe fails', async () => {
      const mockError = new Error('Probe failed');

      (ffmpeg.ffprobe as jest.Mock).mockImplementation((path, callback) => {
        callback(mockError, null);
      });

      await expect(
        ffmpegUtil.getVideoDuration('test-video.mp4'),
      ).rejects.toThrow('Probe failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error probing video:',
        mockError,
      );
    });
  });

  describe('trimVideo', () => {
    let mockFfmpeg;

    beforeEach(() => {
      mockFfmpeg = {
        setStartTime: jest.fn().mockReturnThis(),
        setDuration: jest.fn().mockReturnThis(),
        output: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        run: jest.fn(),
      };

      (ffmpeg as unknown as jest.Mock).mockReturnValue(mockFfmpeg);
    });

    it('should trim video successfully', async () => {
      mockFfmpeg.on.mockImplementation((event, callback) => {
        if (event === 'end') {
          setTimeout(callback, 0);
        }
        return mockFfmpeg;
      });

      await ffmpegUtil.trimVideo('input.mp4', 'output.mp4', 5, 10);

      expect(ffmpeg).toHaveBeenCalledWith('input.mp4');
      expect(mockFfmpeg.setStartTime).toHaveBeenCalledWith(5);
      expect(mockFfmpeg.setDuration).toHaveBeenCalledWith(10);
      expect(mockFfmpeg.output).toHaveBeenCalledWith('output.mp4');
      expect(mockFfmpeg.run).toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should reject when trimming fails', async () => {
      const mockError = new Error('Trimming failed');

      mockFfmpeg.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(mockError), 0);
        }
        return mockFfmpeg;
      });

      await expect(
        ffmpegUtil.trimVideo('input.mp4', 'output.mp4', 5, 10),
      ).rejects.toThrow('Trimming failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error trimming video:',
        mockError,
      );
    });
  });

  describe('mergeVideos', () => {
    let mockMerger;

    beforeEach(() => {
      mockMerger = {
        addInput: jest.fn().mockReturnThis(),
        mergeToFile: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      };

      (ffmpeg as unknown as jest.Mock).mockReturnValue(mockMerger);
    });

    it('should merge videos successfully', async () => {
      const inputFiles = ['video1.mp4', 'video2.mp4'];
      const outputFile = 'merged.mp4';

      mockMerger.on.mockImplementation((event, callback) => {
        if (event === 'end') {
          setTimeout(callback, 0);
        }
        return mockMerger;
      });

      await ffmpegUtil.mergeVideos(inputFiles, outputFile);

      expect(ffmpeg).toHaveBeenCalled();
      expect(mockMerger.addInput).toHaveBeenCalledTimes(2);
      expect(mockMerger.addInput).toHaveBeenNthCalledWith(1, 'video1.mp4');
      expect(mockMerger.addInput).toHaveBeenNthCalledWith(2, 'video2.mp4');
      expect(mockMerger.mergeToFile).toHaveBeenCalledWith('merged.mp4');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should reject when merging fails', async () => {
      const mockError = new Error('Merge failed');
      const inputFiles = ['video1.mp4', 'video2.mp4'];
      const outputFile = 'merged.mp4';

      mockMerger.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(mockError), 0);
        }
        return mockMerger;
      });

      await expect(
        ffmpegUtil.mergeVideos(inputFiles, outputFile),
      ).rejects.toThrow('Merge failed');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
