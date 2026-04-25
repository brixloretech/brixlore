import { api } from "./api";

export type ContentType =
  | "MOVIE"
  | "DOCUMENTARY"
  | "SERIES"
  | "ANIMATION"
  | "TRAILER"
  | "SHORT";

export interface ContentSummaryDto {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  posterUrl?: string | null;
  type: ContentType;
  releaseYear: number;
  ageRating: string;
  category?: string;
}

export interface ContentListResponseDto {
  items: ContentSummaryDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CategoriesResponseDto {
  categories: string[];
}

export interface EpisodeDto {
  id: string;
  seasonId?: string;
  episodeNumber: number;
  title: string;
  description?: string;
  duration: string;
  thumbnailUrl?: string;
}

class ContentService {
  /**
   * Get all content for browse (with high limit for client-side filtering)
   */
  async getContentForBrowse(type?: ContentType): Promise<ContentSummaryDto[]> {
    try {
      const params: Record<string, string> = { limit: "120" };
      if (type) {
        params.type = type;
      }
      const response = await api.get<ContentListResponseDto>("/content", {
        params,
      });
      return response.data.items;
    } catch (error) {
      console.error("Failed to fetch content:", error);
      return [];
    }
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await api.get<CategoriesResponseDto>(
        "/content/categories",
      );
      return response.data.categories || [];
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      return [];
    }
  }

  /**
   * Get content by ID
   */
  async getContentById(id: string) {
    try {
      const response = await api.get(`/content/${id}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch content:", error);
      return null;
    }
  }

  /**
   * Get episodes for a content and season
   */
  async getEpisodes(
    contentId: string,
    seasonId?: string,
  ): Promise<EpisodeDto[]> {
    try {
      const url = seasonId
        ? `/content/${contentId}/episodes?seasonId=${seasonId}`
        : `/content/${contentId}/episodes`;
      const response = await api.get(url);
      if (Array.isArray(response.data)) {
        return response.data as EpisodeDto[];
      }
      if (Array.isArray(response.data?.episodes)) {
        return response.data.episodes as EpisodeDto[];
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch episodes:", error);
      return [];
    }
  }
}

export const contentService = new ContentService();
