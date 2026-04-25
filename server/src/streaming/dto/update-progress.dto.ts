import { IsInt, Min, Max } from 'class-validator';

export class UpdateProgressDto {
  /** Progress in seconds. */
  @IsInt()
  @Min(0)
  @Max(86400 * 24) // cap at 24h
  progress: number;
}
