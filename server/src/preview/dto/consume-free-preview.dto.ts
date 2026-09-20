import { IsInt, Max, Min } from 'class-validator';

export class ConsumeFreePreviewDto {
  @IsInt()
  @Min(0)
  @Max(1200)
  seconds!: number;
}
