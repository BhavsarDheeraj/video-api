import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Video } from './entities/video.entity';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { FfmpegUtil } from '../utils/ffmpeg.util';
import {
  NotFoundException,
  BadRequestException,
  StreamableFile,
  UnauthorizedException,
} from '@nestjs/common';
import * as fs from 'fs';
import { Readable } from 'stream';
import { join, extname } from 'path';

const mockVideoRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
  findBy: jest.fn(),
  findOne: jest.fn(),
});

const mockFfmpegUtil = () => ({
  getVideoDuration: jest.fn(),
  trimVideo: jest.fn(),
  mergeVideos: jest.fn(),
});

const mockConfigService = () => ({
  get: jest.fn(),
});

describe('VideosService', () => {
  let service: VideosService;
  let videoRepository: Repository<Video>;
  let ffmpegUtil: FfmpegUtil;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        { provide: getRepositoryToken(Video), useFactory: mockVideoRepository },
        { provide: FfmpegUtil, useFactory: mockFfmpegUtil },
        { provide: ConfigService, useFactory: mockConfigService },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
    videoRepository = module.get<Repository<Video>>(getRepositoryToken(Video));
    ffmpegUtil = module.get<FfmpegUtil>(FfmpegUtil);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateFilename', () => {
    it('should generate a unique filename with correct extension', () => {
      const originalFilename = 'test-video.mp4';
      const filename = service.generateFilename(originalFilename);
      expect(typeof filename).toBe('string');
      expect(filename).toContain(extname(originalFilename));
    });

    it('should generate different filenames for multiple calls', () => {
      const originalFilename = 'test-video.mp4';
      const filename1 = service.generateFilename(originalFilename);
      const filename2 = service.generateFilename(originalFilename);
      expect(filename1).not.toEqual(filename2);
    });
  });

  describe('create', () => {
    it('should create and save a video', async () => {
      const mockFileData = {
        filename: 'test.mp4',
        originalFilename: 'test.mp4',
        path: '/path/to/test.mp4',
        size: 1234,
        duration: 0,
      };
      const mockSavedVideo = { id: 'uuid', ...mockFileData, duration: 60000 };

      (videoRepository.create as jest.Mock).mockReturnValue(mockFileData);
      (videoRepository.save as jest.Mock).mockResolvedValue(mockSavedVideo);
      (ffmpegUtil.getVideoDuration as jest.Mock).mockResolvedValue(60000);

      const result = await service.create(mockFileData);

      expect(videoRepository.create).toHaveBeenCalledWith(mockFileData);
      expect(videoRepository.save).toHaveBeenCalledWith(mockFileData);
      expect(ffmpegUtil.getVideoDuration).toHaveBeenCalledWith(
        '/path/to/test.mp4',
      );
      expect(result).toEqual(mockSavedVideo);
    });

    it('should handle error if ffmpegUtil.getVideoDuration fails', async () => {
      const mockFileData = {
        filename: 'test.mp4',
        originalFilename: 'test.mp4',
        path: '/path/to/test.mp4',
        size: 1234,
        duration: 0,
      };
      const mockSavedVideo = { id: 'uuid', ...mockFileData, duration: 0 };

      (videoRepository.create as jest.Mock).mockReturnValue(mockFileData);
      (videoRepository.save as jest.Mock).mockResolvedValue(mockSavedVideo);
      (ffmpegUtil.getVideoDuration as jest.Mock).mockRejectedValue(
        new Error('FFmpeg probe error'),
      );

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await service.create(mockFileData);

      expect(ffmpegUtil.getVideoDuration).toHaveBeenCalledWith(
        '/path/to/test.mp4',
      );
      expect(console.error).toHaveBeenCalled();
      expect(result).toEqual(mockSavedVideo);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('trim', () => {
    it('should trim a video successfully', async () => {
      const mockVideoId = 'existing-video-id';
      const mockStartTime = 5;
      const mockEndTime = 15;
      const mockExistingVideo = {
        id: mockVideoId,
        path: '/path/to/original.mp4',
        originalFilename: 'original.mp4',
      };
      const mockTrimmedVideo = {
        id: 'trimmed-uuid',
        filename: 'trimmed_original.mp4',
        path: '/path/to/trimmed_original.mp4',
        originalFilename: 'original.mp4',
      };

      (videoRepository.findOneBy as jest.Mock).mockResolvedValue(
        mockExistingVideo,
      );
      (service.generateFilename as jest.Mock) = jest
        .fn()
        .mockReturnValue('trimmed_original.mp4');
      (ffmpegUtil.trimVideo as jest.Mock).mockResolvedValue(undefined);
      (service.create as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockTrimmedVideo);

      const result = await service.trim(
        mockVideoId,
        mockStartTime,
        mockEndTime,
      );

      expect(videoRepository.findOneBy).toHaveBeenCalledWith({
        id: mockVideoId,
      });
      expect(ffmpegUtil.trimVideo).toHaveBeenCalledWith(
        mockExistingVideo.path,
        './storage/trimmed_original.mp4',
        mockStartTime,
        mockEndTime - mockStartTime,
      );
      expect(service.create).toHaveBeenCalled();
      expect(result).toEqual(mockTrimmedVideo);
    });

    it('should throw NotFoundException if video is not found', async () => {
      (videoRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.trim('non-existent-id', 5, 15)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if ffmpegUtil.trimVideo fails', async () => {
      const mockVideoId = 'existing-video-id';
      const mockStartTime = 5;
      const mockEndTime = 15;
      const mockExistingVideo = {
        id: mockVideoId,
        path: '/path/to/original.mp4',
        originalFilename: 'original.mp4',
      };

      (videoRepository.findOneBy as jest.Mock).mockResolvedValue(
        mockExistingVideo,
      );
      (ffmpegUtil.trimVideo as jest.Mock).mockRejectedValue(
        new Error('FFmpeg trim error'),
      );

      await expect(
        service.trim(mockVideoId, mockStartTime, mockEndTime),
      ).rejects.toThrowError('FFmpeg trim error');
      expect(ffmpegUtil.trimVideo).toHaveBeenCalled();
    });
  });

  describe('merge', () => {
    it('should merge videos successfully', async () => {
      const mockVideoIds = ['video-id-1', 'video-id-2'];
      const mockVideos = [
        { id: 'video-id-1', path: '/path/to/video1.mp4' },
        { id: 'video-id-2', path: '/path/to/video2.mp4' },
      ];
      const mockMergedVideo = {
        id: 'merged-uuid',
        filename: 'merged_video.mp4',
        path: '/path/to/merged_video.mp4',
        originalFilename: 'merged_video.mp4',
      };

      (videoRepository.findBy as jest.Mock).mockResolvedValue(mockVideos);
      (service.generateFilename as jest.Mock) = jest
        .fn()
        .mockReturnValue('merged_video.mp4');
      (ffmpegUtil.mergeVideos as jest.Mock).mockResolvedValue(undefined);
      (service.create as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockMergedVideo);

      const result = await service.merge(mockVideoIds);

      expect(videoRepository.findBy).toHaveBeenCalledWith({
        id: In(mockVideoIds),
      });
      expect(ffmpegUtil.mergeVideos).toHaveBeenCalledWith(
        ['/path/to/video1.mp4', '/path/to/video2.mp4'],
        './storage/merged_video.mp4',
      );
      expect(result).toEqual(mockMergedVideo);
    });

    it('should throw BadRequestException if no video IDs are provided', async () => {
      await expect(service.merge([])).rejects.toThrow(BadRequestException);
      await expect(service.merge(null as unknown as [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if only one video ID is provided', async () => {
      await expect(service.merge(['video-id-1'])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if some videos are not found', async () => {
      const mockVideoIds = ['video-id-1', 'video-id-2', 'video-id-3'];
      const mockVideos = [{ id: 'video-id-1', path: '/path/to/video1.mp4' }];

      (videoRepository.findBy as jest.Mock).mockResolvedValue(mockVideos);

      await expect(service.merge(mockVideoIds)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if ffmpegUtil.mergeVideos fails', async () => {
      const mockVideoIds = ['video-id-1', 'video-id-2'];
      const mockVideos = [
        { id: 'video-id-1', path: '/path/to/video1.mp4' },
        { id: 'video-id-2', path: '/path/to/video2.mp4' },
      ];

      (videoRepository.findBy as jest.Mock).mockResolvedValue(mockVideos);
      (ffmpegUtil.mergeVideos as jest.Mock).mockRejectedValue(
        new Error('FFmpeg merge error'),
      );

      await expect(service.merge(mockVideoIds)).rejects.toThrowError(
        'FFmpeg merge error',
      );
      expect(ffmpegUtil.mergeVideos).toHaveBeenCalled();
    });
  });

  describe('generateShareLink', () => {
    it('should generate a share link successfully', async () => {
      const mockVideoId = 'video-id';
      const mockVideo = {
        id: mockVideoId,
        shareLink: null,
        shareLinkExpiry: null,
      };
      const updatedMockVideo = {
        id: mockVideoId,
        shareLink: expect.any(String),
        shareLinkExpiry: expect.any(Number),
      };

      (videoRepository.findOneBy as jest.Mock).mockResolvedValue(mockVideo);
      (videoRepository.save as jest.Mock).mockResolvedValue(updatedMockVideo);
      (configService.get as jest.Mock).mockReturnValue('3600');

      const result = await service.generateShareLink(mockVideoId);

      expect(videoRepository.findOneBy).toHaveBeenCalledWith({
        id: mockVideoId,
      });
      expect(videoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          shareLink: expect.any(String),
          shareLinkExpiry: expect.any(Number),
        }),
      );
      expect(result.shareLink).toBeDefined();
      expect(result.shareLinkExpiry).toBeDefined();
    });

    it('should throw NotFoundException if video is not found', async () => {
      (videoRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(
        service.generateShareLink('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('streamVideo', () => {
    it('should return a StreamableFile for a valid video ID', async () => {
      const mockVideoId = 'video-id';
      const mockVideo = { id: mockVideoId, path: '/path/to/video.mp4' };

      const mockReadStream = new Readable({
        read() {
          this.push('some data');
          this.push(null);
        },
      });
      jest.spyOn(fs, 'createReadStream').mockReturnValue(mockReadStream as any);
      (videoRepository.findOneBy as jest.Mock).mockResolvedValue(mockVideo);

      const result = await service.streamVideo(mockVideoId);

      expect(videoRepository.findOneBy).toHaveBeenCalledWith({
        id: mockVideoId,
      });
      expect(fs.createReadStream).toHaveBeenCalledWith(
        join(process.cwd(), mockVideo.path),
      );
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('should throw NotFoundException if video is not found', async () => {
      (videoRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(service.streamVideo('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getVideoByShareLinkAndStream', () => {
    it('should return video and stream for a valid token', async () => {
      const mockToken = 'valid-token';
      const mockVideo = {
        id: 'video-id',
        path: '/path/to/video.mp4',
        shareLink: mockToken,
        shareLinkExpiry: Date.now() + 3600000,
      };
      const mockReadStream = new Readable({
        read() {
          this.push('some data');
          this.push(null);
        },
      });
      jest.spyOn(fs, 'createReadStream').mockReturnValue(mockReadStream as any);
      (videoRepository.findOne as jest.Mock).mockResolvedValue(mockVideo);

      const result = await service.getVideoByShareLinkAndStream(mockToken);

      expect(videoRepository.findOne).toHaveBeenCalledWith({
        where: { shareLink: mockToken },
      });
      expect(fs.createReadStream).toHaveBeenCalledWith(
        join(process.cwd(), mockVideo.path),
      );
      expect(result.video).toEqual(mockVideo);
      expect(result.stream).toBeInstanceOf(StreamableFile);
    });

    it('should throw NotFoundException for an invalid token', async () => {
      (videoRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getVideoByShareLinkAndStream('invalid-token'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException for an expired token', async () => {
      const mockToken = 'expired-token';
      const mockVideo = {
        id: 'video-id',
        path: '/path/to/video.mp4',
        shareLink: mockToken,
        shareLinkExpiry: Date.now() - 3600000,
      };

      (videoRepository.findOne as jest.Mock).mockResolvedValue(mockVideo);
      await expect(
        service.getVideoByShareLinkAndStream(mockToken),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
