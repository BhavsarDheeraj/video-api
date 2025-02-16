import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBody,
} from '@nestjs/swagger';
import { MergeVideosResponseDto } from '../dto/responses.dto';
import { MergeVideosDto } from '../dto/merge-videos.dto';

export function ApiVideoMerge() {
  return applyDecorators(
    ApiOperation({ summary: 'Merge multiple video clips' }),
    ApiBody({
      type: MergeVideosDto,
      examples: {
        'application/json': {
          summary: 'Sample Merge Request',
          description: 'Sample request to merge multiple videos',
          value: {
            videoIds: [
              'video-uuid-1-example',
              'video-uuid-2-example',
              'video-uuid-3-example',
            ],
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'Videos merged successfully',
      type: MergeVideosResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid merge request (invalid videoIds array)',
    }),
    ApiNotFoundResponse({ description: 'One or more video IDs not found' }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - API key missing or invalid',
    }),
  );
}
