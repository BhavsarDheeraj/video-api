import {
  BadRequestException,
  ArgumentMetadata,
  Paramtype,
} from '@nestjs/common';
import { FileValidationPipe } from './file-validation.pipe';
import { ConfigService } from '@nestjs/config';

describe('FileValidationPipe', () => {
  let pipe: FileValidationPipe;
  let configService: Partial<ConfigService>;
  let metadata: ArgumentMetadata;

  // Fake file object for testing
  const fakeFile = { path: 'fakePath', size: 5000, mimetype: 'video/mp4' };

  beforeEach(() => {
    // Mocking ConfigService. Yahan MAX_SIZE_IN_MB ko "5" set kiya gaya hai.
    configService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'MAX_SIZE_IN_MB') return '5';
        return defaultValue;
      }),
    };

    pipe = new FileValidationPipe(configService as ConfigService);
    metadata = { type: 'file' as Paramtype, metatype: undefined, data: '' };
  });

  it('should throw BadRequestException if no file is uploaded', async () => {
    await expect(pipe.transform(null, metadata)).rejects.toThrow(
      BadRequestException,
    );
    await expect(pipe.transform(null, metadata)).rejects.toThrow(
      'No file uploaded',
    );
  });

  it('should throw BadRequestException if file size is invalid', async () => {
    // Override maxFileSizeValidator.isValid to simulate invalid size
    pipe['maxFileSizeValidator'].isValid = jest.fn(() => false);
    await expect(pipe.transform(fakeFile, metadata)).rejects.toThrow(
      'Invalid size',
    );
  });

  it('should throw BadRequestException if file type is invalid', async () => {
    // Simulate valid size
    pipe['maxFileSizeValidator'].isValid = jest.fn(() => true);
    // Override fileTypeValidator.isValid to return false
    pipe['fileTypeValidator'].isValid = jest.fn().mockReturnValue(false);
    await expect(pipe.transform(fakeFile, metadata)).rejects.toThrow(
      'Invalid type',
    );
  });

  it('should throw BadRequestException if video duration validation fails', async () => {
    // Simulate valid size and type
    pipe['maxFileSizeValidator'].isValid = jest.fn(() => true);
    pipe['fileTypeValidator'].isValid = jest.fn().mockReturnValue(true);
    // Override videoDurationValidator.transform to reject with an error
    const durationError = new Error('Video duration too long');
    pipe['videoDurationValidator'].transform = jest.fn(() =>
      Promise.reject(durationError),
    );

    await expect(pipe.transform(fakeFile, metadata)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should return the file if all validations pass', async () => {
    // Simulate valid size and type
    pipe['maxFileSizeValidator'].isValid = jest.fn(() => true);
    pipe['fileTypeValidator'].isValid = jest.fn().mockReturnValue(true);
    // Simulate videoDurationValidator.transform resolving successfully
    pipe['videoDurationValidator'].transform = jest.fn(() =>
      Promise.resolve(fakeFile),
    );

    const result = await pipe.transform(fakeFile, metadata);
    expect(result).toEqual(fakeFile);
  });
});
