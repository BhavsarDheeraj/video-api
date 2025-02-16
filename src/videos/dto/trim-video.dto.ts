import { IsNotEmpty, IsNumber, IsPositive, Min, IsUUID } from 'class-validator';

export class TrimVideoDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  startTime: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  endTime: number;
}
