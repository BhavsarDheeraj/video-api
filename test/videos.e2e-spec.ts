import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';
import { FfmpegUtil } from '../src/utils/ffmpeg.util';

class FakeFfmpegUtil {
  getVideoDuration(filePath: string): Promise<number> {
    return Promise.resolve(30000);
  }
  trimVideo(
    inputFile: string,
    outputFile: string,
    startTime: number,
    duration: number,
  ): Promise<void> {
    return Promise.resolve();
  }
  mergeVideos(inputFiles: string[], outputFile: string): Promise<void> {
    return Promise.resolve();
  }
}

describe('VideosController (e2e)', () => {
  let app: INestApplication;

  const testApiKey = 'test-api-key';

  const testVideoFilePath = path.join(__dirname, 'test-video.mp4');

  beforeAll(async () => {
    process.env.API_KEY = testApiKey;

    if (!fs.existsSync(testVideoFilePath)) {
      fs.writeFileSync(testVideoFilePath, Buffer.from('dummy video content'));
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FfmpegUtil)
      .useValue(new FakeFfmpegUtil())
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let uploadedVideoId: string;
  let uploadedVideoId2: string;

  it('/videos/upload (POST) - should upload a video', async () => {
    const response = await request(app.getHttpServer())
      .post('/videos/upload')
      .set('x-api-key', testApiKey)
      .attach('file', testVideoFilePath)
      .expect(201);

    expect(response.body.message).toBe('File uploaded successfully');
    expect(response.body.data).toBeDefined();
    uploadedVideoId = response.body.data.id;
  });

  it('/videos/trim (POST) - should trim a video', async () => {
    if (!uploadedVideoId) {
      const uploadRes = await request(app.getHttpServer())
        .post('/videos/upload')
        .set('x-api-key', testApiKey)
        .attach('file', testVideoFilePath)
        .expect(201);
      uploadedVideoId = uploadRes.body.data.id;
    }

    const response = await request(app.getHttpServer())
      .post('/videos/trim')
      .set('x-api-key', testApiKey)
      .send({ id: uploadedVideoId, startTime: 10, endTime: 20 })
      .expect(201);

    expect(response.body.message).toBe('Video trimmed successfully');
    expect(response.body.data).toBeDefined();
  });

  it('/videos/merge (POST) - should merge videos', async () => {
    const uploadRes1 = await request(app.getHttpServer())
      .post('/videos/upload')
      .set('x-api-key', testApiKey)
      .attach('file', testVideoFilePath)
      .expect(201);
    const uploadRes2 = await request(app.getHttpServer())
      .post('/videos/upload')
      .set('x-api-key', testApiKey)
      .attach('file', testVideoFilePath)
      .expect(201);
    uploadedVideoId = uploadRes1.body.data.id;
    uploadedVideoId2 = uploadRes2.body.data.id;

    const response = await request(app.getHttpServer())
      .post('/videos/merge')
      .set('x-api-key', testApiKey)
      .send({ videoIds: [uploadedVideoId, uploadedVideoId2] })
      .expect(201);

    expect(response.body.message).toBe('Videos merged successfully');
    expect(response.body.data).toBeDefined();
  });

  it('/videos/shared/:token (GET) - should return 404 for non-existent share link', async () => {
    await request(app.getHttpServer())
      .get('/videos/shared/non-existent-token')
      .set('x-api-key', testApiKey)
      .expect(404);
  });
});
