import { IsNotEmpty, IsUUID } from 'class-validator';

export class ShareVideoDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;
}
