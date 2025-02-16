import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ShareVideoResponseDto } from '../dto/responses.dto';
import { ShareVideoDto } from '../dto/share-video.dto';

export function ApiVideoShare() {
  return applyDecorators(
    ApiOperation({ summary: 'Generate a shareable link for a video' }),
    ApiBody({
      type: ShareVideoDto,
      examples: {
        'application/json': {
          summary: 'Sample Share Request',
          description: 'Request to generate a share link for a video',
          value: {
            id: 'video-uuid-example',
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'Share link generated successfully',
      type: ShareVideoResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid share request (invalid videoId)',
    }),
    ApiNotFoundResponse({ description: 'Video not found' }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - API key missing or invalid',
    }),
  );
}
