import type {
  PaginationQueryDto,
  ContentListResponseDto,
  ContentDetailResponseDto,
  ContentSummaryDto,
  ContentType,
  EpisodeResponseDto,
  SeasonResponseDto,
} from "@/types/api";
import { get } from "@/lib/api-client";
import { mockVideos } from "@/lib/mock-videos";
import { getAdminVideos } from "@/lib/mock-admin-content";
import type { Video } from "@/types";
import type { AdminVideo } from "@/types";
import { USE_MOCK_API } from "./config";

function toSummaryFromVideo(v: Video | AdminVideo): ContentSummaryDto {
  const year = new Date().getFullYear();
  return {
    id: v.id,
    title: v.title,
    thumbnailUrl: "thumbnailUrl" in v ? (v.thumbnailUrl ?? null) : null,
    posterUrl: null,
    bannerUrl: "bannerUrl" in v ? ((v as Record<string, unknown>).bannerUrl as string ?? null) : null,
    type: "MOVIE",
    releaseYear: year,
    ageRating: "NR",
    category: "category" in v ? (v.category ?? undefined) : undefined,
  };
}

function paginate<T>(
  items: T[],
  page = 1,
  limit = 20,
): { items: T[]; total: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const itemsSlice = items.slice(start, start + limit);
  return { items: itemsSlice, total, totalPages };
}

function getFallbackCatalog(type?: ContentType): ContentSummaryDto[] {
  const items = mockVideos.map((v) =>
    toSummaryFromVideo({ ...v, id: v.id, publishedAt: v.publishedAt }),
  );
  if (!type) return items;
  return items.filter((item) => item.type === type);
}

/**
 * Content service. Uses real API when USE_MOCK_API is false.
 */
export const contentService = {
  /**
   * List content (catalog). Real API: GET /content with pagination.
   */
  async getContent(
    params?: PaginationQueryDto,
    type?: ContentType,
  ): Promise<ContentListResponseDto> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 24;
    if (!USE_MOCK_API) {
      try {
        return await get<ContentListResponseDto>("content", {
          params: {
            page: String(page),
            limit: String(limit),
            ...(type ? { type } : {}),
          },
        });
      } catch {
        const fallback = getFallbackCatalog(type);
        const { items, total, totalPages } = paginate(fallback, page, limit);
        return {
          items,
          meta: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        };
      }
    }
    const adminVideos = getAdminVideos();
    const catalog: ContentSummaryDto[] = [
      ...mockVideos.map((v) =>
        toSummaryFromVideo({ ...v, id: v.id, publishedAt: v.publishedAt }),
      ),
      ...adminVideos.map((v) => toSummaryFromVideo(v)),
    ];
    const { items, total, totalPages } = paginate(catalog, page, limit);
    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * Get all content for browse (for client-side filter/search). Real API: GET /content with high limit.
   * Pass { cache: 'no-store' } when calling from the server (e.g. browse page) so new content shows immediately.
   */
  async getContentForBrowse(
    type?: ContentType,
    options?: { cache?: RequestCache },
  ): Promise<ContentSummaryDto[]> {
    if (!USE_MOCK_API) {
      try {
        // Use 120 items for faster API response (thumbnail URL resolution). Enough for browse rows.
        const res = await get<ContentListResponseDto>("content", {
          params: { limit: "120", ...(type ? { type } : {}) },
          ...(options?.cache ? { cache: options.cache } : {}),
        });
        return res.items;
      } catch {
        return getFallbackCatalog(type);
      }
    }
    const adminVideos = getAdminVideos().filter((v) => v.published);
    const fromCatalog = mockVideos.map((v) =>
      toSummaryFromVideo({ ...v, id: v.id, publishedAt: v.publishedAt }),
    );
    const fromAdmin = adminVideos.map((v) => toSummaryFromVideo(v));
    return [...fromCatalog, ...fromAdmin];
  },

  /** Categories for browse filters. Real API: GET /content/categories. */
  async getCategories(): Promise<string[]> {
    if (!USE_MOCK_API) {
      const res = await get<{ categories: string[] }>("content/categories");
      return res.categories ?? [];
    }
    const adminVideos = getAdminVideos();
    const categories = new Set<string>();
    for (const video of mockVideos) {
      if (video.category) categories.add(video.category);
    }
    for (const video of adminVideos) {
      if (video.category) categories.add(video.category);
    }
    return ["All", ...Array.from(categories).sort()];
  },

  /**
   * Get single content detail. Real API: GET /content/:id.
   */
  async getContentById(id: string): Promise<ContentDetailResponseDto | null> {
    if (!USE_MOCK_API) {
      try {
        return await get<ContentDetailResponseDto>(`content/${id}`);
      } catch {
        return null;
      }
    }
    const admin = getAdminVideos();
    const fromAdmin = admin.find((v) => v.id === id);
    if (fromAdmin) {
      return {
        content: {
          id: fromAdmin.id,
          title: fromAdmin.title,
          description: fromAdmin.description,
          type: "MOVIE",
          thumbnailUrl: null,
          releaseYear: new Date().getFullYear(),
          ageRating: "NR",
          category: fromAdmin.category ?? undefined,
          duration: fromAdmin.duration,
          episodes: [
            {
              id: fromAdmin.id,
              episodeNumber: 1,
              title: fromAdmin.title,
              duration: fromAdmin.duration,
            },
          ],
        },
      };
    }
    const fromCatalog = mockVideos.find((v) => v.id === id);
    if (fromCatalog) {
      return {
        content: {
          id: fromCatalog.id,
          title: fromCatalog.title,
          description: fromCatalog.description,
          type: "MOVIE",
          thumbnailUrl: fromCatalog.thumbnailUrl ?? null,
          releaseYear: new Date().getFullYear(),
          ageRating: "NR",
          category: fromCatalog.category ?? undefined,
          duration: fromCatalog.duration,
          episodes: [
            {
              id: fromCatalog.id,
              episodeNumber: 1,
              title: fromCatalog.title,
              duration: fromCatalog.duration ?? "0:00",
            },
          ],
        },
      };
    }
    return null;
  },

  /** Seasons for a content item. Real API: GET /content/:id/seasons. */
  async getSeasons(contentId: string): Promise<SeasonResponseDto[] | null> {
    if (!USE_MOCK_API) {
      try {
        return await get<SeasonResponseDto[]>(`content/${contentId}/seasons`);
      } catch {
        return null;
      }
    }
    return null;
  },

  /** Episodes for a content item. Real API: GET /content/:id/episodes. */
  async getEpisodes(
    contentId: string,
    seasonId?: string,
  ): Promise<EpisodeResponseDto[] | null> {
    if (!USE_MOCK_API) {
      try {
        return await get<EpisodeResponseDto[]>(
          `content/${contentId}/episodes`,
          {
            params: seasonId ? { seasonId } : undefined,
          },
        );
      } catch {
        return null;
      }
    }
    return null;
  },

  /** Admin mock list. */
  getAdminVideoList(): AdminVideo[] {
    return getAdminVideos();
  },
};
