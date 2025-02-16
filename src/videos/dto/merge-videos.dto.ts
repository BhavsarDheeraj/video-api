import { IsNotEmpty, IsArray, ArrayMinSize, IsUUID } from 'class-validator';

export class MergeVideosDto {
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('all', { each: true })
  videoIds: string[];
}
