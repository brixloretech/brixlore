export class ContinueWatchingItemDto {
  contentId: string;
  episodeId: string;
  contentTitle: string;
  episodeTitle: string;
  progress: number; // seconds watched
  duration: number; // episode duration in seconds
  thumbnailUrl: string | null;
  type: string; // ContentType
  watchedAt: string; // ISO date
}
