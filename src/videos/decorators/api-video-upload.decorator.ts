import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UploadVideoResponseDto } from '../dto/responses.dto';

export function ApiVideoUpload() {
  return applyDecorators(
    ApiOperation({ summary: 'Upload a video file' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Video file to upload',
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'The video file to upload (mp4 format)',
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'Video uploaded successfully',
      type: UploadVideoResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid file upload (size, type, duration)',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - API key missing or invalid',
    }),
  );
}
