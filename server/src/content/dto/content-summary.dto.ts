export class ContentSummaryDto {
  id: string;
  title: string;
  type: string;
  thumbnailUrl: string | null;
  posterUrl?: string | null;
  bannerUrl?: string | null;
  releaseYear: number;
  ageRating: string;
  category?: string;
}
