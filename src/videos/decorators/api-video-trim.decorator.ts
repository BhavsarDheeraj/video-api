import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBody,
} from '@nestjs/swagger';
import { TrimVideoResponseDto } from '../dto/responses.dto';
import { TrimVideoDto } from '../dto/trim-video.dto';

export function ApiVideoTrim() {
  return applyDecorators(
    ApiOperation({ summary: 'Trim a video clip' }),
    ApiBody({
      type: TrimVideoDto,
      examples: {
        'application/json': {
          summary: 'Sample Trim Request',
          description: 'Sample request body to trim a video',
          value: {
            id: 'video-uuid-example',
            startTime: 10,
            endTime: 30,
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'Video trimmed successfully',
      type: TrimVideoResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid trim request (startTime, endTime, videoId)',
    }),
    ApiNotFoundResponse({ description: 'Video not found' }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - API key missing or invalid',
    }),
  );
}
