import { EpisodeResponseDto } from './episode-response.dto';
import { SeasonResponseDto } from './season-response.dto';

export class ContentTrailerDto {
  id: string;
  title: string;
  duration: string;
}

export class ContentDetailDto {
  id: string;
  title: string;
  description?: string;
  type: string;
  thumbnailUrl: string | null;
  posterUrl?: string | null;
  releaseYear: number;
  ageRating: string;
  duration?: string;
  trailer?: ContentTrailerDto;
  seasons?: SeasonResponseDto[];
  episodes?: EpisodeResponseDto[];
}

export class ContentDetailResponseDto {
  content: ContentDetailDto;
}
