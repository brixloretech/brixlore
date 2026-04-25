export class EpisodeResponseDto {
  id: string;
  seasonId?: string;
  episodeNumber: number;
  title: string;
  description?: string;
  duration: string;
  thumbnailUrl?: string;
}
