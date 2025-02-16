import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { Request, Response } from 'express';
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

describe('VideosController', () => {
  let videosController: VideosController;
  let videosService: Partial<VideosService>;
  let res: Partial<Response>;
  let req: Partial<Request>;

  beforeEach(() => {
    videosService = {
      create: jest.fn(),
      trim: jest.fn(),
      merge: jest.fn(),
      generateShareLink: jest.fn(),
      getVideoByShareLinkAndStream: jest.fn(),
    };

    videosController = new VideosController(videosService as VideosService);

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn(),
    };

    req = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000'),
    };
  });

  describe('uploadVideo', () => {
    it('should upload video successfully and return 201', async () => {
      const file = {
        filename: 'test.mp4',
        originalname: 'test.mp4',
        path: '/uploads/test.mp4',
        size: 1024,
      } as Express.Multer.File;
      const createdVideo = { id: '123', filename: 'test.mp4' };
      (videosService.create as jest.Mock).mockResolvedValue(createdVideo);

      await videosController.uploadVideo(file, res as Response);

      expect(videosService.create).toHaveBeenCalledWith({
        filename: file.filename,
        originalFilename: file.originalname,
        path: file.path,
        size: file.size,
        duration: 0,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'File uploaded successfully',
        data: createdVideo,
      });
    });

    it('should handle errors during upload and return 500', async () => {
      const file = {
        filename: 'test.mp4',
        originalname: 'test.mp4',
        path: '/uploads/test.mp4',
        size: 1024,
      } as Express.Multer.File;
      (videosService.create as jest.Mock).mockRejectedValue(
        new Error('Upload error'),
      );

      await videosController.uploadVideo(file, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to upload video',
      });
    });
  });

  describe('trimVideo', () => {
    it('should trim video successfully and return 201', async () => {
      const trimVideoDto = { id: '123', startTime: 10, endTime: 20 };
      const trimmedVideo = { id: 'trimmed123' };
      (videosService.trim as jest.Mock).mockResolvedValue(trimmedVideo);

      await videosController.trimVideo(trimVideoDto, res as Response);

      expect(videosService.trim).toHaveBeenCalledWith('123', 10, 20);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Video trimmed successfully',
        data: trimmedVideo,
      });
    });

    it('should return 500 if startTime is greater than or equal to endTime', async () => {
      const trimVideoDto = { id: '123', startTime: 20, endTime: 10 };

      await videosController.trimVideo(trimVideoDto, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to trim video',
      });
    });

    it('should return 404 if videosService.trim throws NotFoundException', async () => {
      const trimVideoDto = { id: '123', startTime: 10, endTime: 20 };
      (videosService.trim as jest.Mock).mockRejectedValue(
        new NotFoundException('Video not found'),
      );

      await videosController.trimVideo(trimVideoDto, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Video not found' });
    });
  });

  describe('mergeVideos', () => {
    it('should merge videos successfully and return 201', async () => {
      const mergeVideosDto = { videoIds: ['1', '2'] };
      const mergedVideo = { id: 'merged123' };
      (videosService.merge as jest.Mock).mockResolvedValue(mergedVideo);

      await videosController.mergeVideos(mergeVideosDto, res as Response);

      expect(videosService.merge).toHaveBeenCalledWith(['1', '2']);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Videos merged successfully',
        data: mergedVideo,
      });
    });

    it('should return 404 if videosService.merge throws NotFoundException', async () => {
      const mergeVideosDto = { videoIds: ['1', '2'] };
      (videosService.merge as jest.Mock).mockRejectedValue(
        new NotFoundException('Videos not found'),
      );

      await videosController.mergeVideos(mergeVideosDto, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Videos not found' });
    });

    it('should return 400 if videosService.merge throws BadRequestException', async () => {
      const mergeVideosDto = { videoIds: ['1'] };
      (videosService.merge as jest.Mock).mockRejectedValue(
        new BadRequestException('At least two videos are required to merge'),
      );

      await videosController.mergeVideos(mergeVideosDto, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'At least two videos are required to merge',
      });
    });

    it('should return 500 for other errors during merge', async () => {
      const mergeVideosDto = { videoIds: ['1', '2'] };
      (videosService.merge as jest.Mock).mockRejectedValue(
        new Error('Merge error'),
      );

      await videosController.mergeVideos(mergeVideosDto, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to merge videos',
      });
    });
  });

  describe('shareVideo', () => {
    it('should generate share link successfully and return 201', async () => {
      const shareVideoDto = { id: '123' };
      const videoWithShare = {
        shareLink: 'token123',
        shareLinkExpiry: Date.now() + 3600000,
      };
      (videosService.generateShareLink as jest.Mock).mockResolvedValue(
        videoWithShare,
      );

      await videosController.shareVideo(
        shareVideoDto,
        res as Response,
        req as Request,
      );

      expect(videosService.generateShareLink).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Share link generated successfully',
        link: `http://localhost:3000/videos/shared/${videoWithShare.shareLink}`,
        expiry: videoWithShare.shareLinkExpiry,
      });
    });

    it('should return 404 if videosService.generateShareLink throws NotFoundException', async () => {
      const shareVideoDto = { id: '123' };
      (videosService.generateShareLink as jest.Mock).mockRejectedValue(
        new NotFoundException('Video not found'),
      );

      await videosController.shareVideo(
        shareVideoDto,
        res as Response,
        req as Request,
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Video not found' });
    });

    it('should return 500 for other errors during share link generation', async () => {
      const shareVideoDto = { id: '123' };
      (videosService.generateShareLink as jest.Mock).mockRejectedValue(
        new Error('Share error'),
      );

      await videosController.shareVideo(
        shareVideoDto,
        res as Response,
        req as Request,
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to generate share link',
      });
    });
  });

  describe('getSharedVideo', () => {
    it('should return streamable file and set headers on success', async () => {
      const token = 'token123';
      const fakeVideo = { originalFilename: 'video.mp4' };
      const fakeStream = { pipe: jest.fn() };
      (
        videosService.getVideoByShareLinkAndStream as jest.Mock
      ).mockResolvedValue({
        video: fakeVideo,
        stream: fakeStream,
      });

      const result = await videosController.getSharedVideo(
        token,
        res as Response,
      );

      expect(videosService.getVideoByShareLinkAndStream).toHaveBeenCalledWith(
        token,
      );
      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': 'video/mp4',
        'Content-Disposition': `inline; filename="${fakeVideo.originalFilename}"`,
      });
      expect(result).toBe(fakeStream);
    });

    it('should throw NotFoundException if videosService.getVideoByShareLinkAndStream throws NotFoundException', async () => {
      const token = 'token123';
      (
        videosService.getVideoByShareLinkAndStream as jest.Mock
      ).mockRejectedValue(new NotFoundException('Invalid share link'));
      await expect(
        videosController.getSharedVideo(token, res as Response),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if videosService.getVideoByShareLinkAndStream throws UnauthorizedException', async () => {
      const token = 'token123';
      (
        videosService.getVideoByShareLinkAndStream as jest.Mock
      ).mockRejectedValue(new UnauthorizedException('Share link has expired'));
      await expect(
        videosController.getSharedVideo(token, res as Response),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException for other errors', async () => {
      const token = 'token123';
      (
        videosService.getVideoByShareLinkAndStream as jest.Mock
      ).mockRejectedValue(new Error('Some error'));
      await expect(
        videosController.getSharedVideo(token, res as Response),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
