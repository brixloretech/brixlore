import { IsInt, Max, Min } from 'class-validator';

export class CompletePreviewSessionDto {
  @IsInt()
  @Min(0)
  @Max(45)
  watchedSeconds!: number;
}
