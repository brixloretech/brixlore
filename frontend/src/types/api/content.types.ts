/**
 * API contract types for content (catalog, seasons, episodes, admin).
 * Backend-ready for NestJS (e.g. ContentModule, admin guards).
 */

export type ContentType =
  | "MOVIE"
  | "DOCUMENTARY"
  | "SERIES"
  | "ANIMATION"
  | "TRAILER"
  | "SHORT";

/** Pagination query params (GET list endpoints). */
export interface PaginationQueryDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** Pagination meta in list responses. */
export interface PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Content summary as returned by the API (public catalog). */
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

/** Response for GET /content (catalog list). */
export interface ContentListResponseDto {
  items: ContentSummaryDto[];
  meta: PaginationMetaDto;
}

export interface SeasonResponseDto {
  id: string;
  seasonNumber: number;
  title: string;
  description?: string;
  episodeCount: number;
}

export interface EpisodeResponseDto {
  id: string;
  seasonId?: string;
  episodeNumber: number;
  title: string;
  description?: string;
  duration: string;
  thumbnailUrl?: string;
}

export interface ContentTrailerDto {
  id: string;
  title: string;
  duration: string;
}

export interface ContentDetailDto {
  id: string;
  title: string;
  description?: string;
  type: ContentType;
  thumbnailUrl: string | null;
  posterUrl?: string | null;
  releaseYear: number;
  ageRating: string;
  duration?: string;
  category?: string;
  trailer?: ContentTrailerDto;
  seasons?: SeasonResponseDto[];
  episodes?: EpisodeResponseDto[];
}

/** Response for GET /content/:id */
export interface ContentDetailResponseDto {
  content: ContentDetailDto;
}

/** Request body for POST /admin/content */
export interface CreateAdminContentRequestDto {
  title: string;
  description?: string;
  type: ContentType;
  thumbnailKey: string;
  posterKey?: string;
  releaseYear: number;
  ageRating: string;
  duration?: string;
  categoryId?: string;
  category?: string;
  videoKey?: string;
  hlsKey?: string;
  isPublished?: boolean;
}

/** Request body for POST /admin/uploads/presign */
export interface PresignUploadRequestDto {
  kind: "video" | "thumbnail";
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadId?: string;
}

/** Response for POST /admin/uploads/presign */
export interface PresignUploadResponseDto {
  uploadId: string;
  key: string;
  url: string;
  expiresAt: string;
  publicUrl?: string;
}

/** Request body for POST /admin/uploads/multipart/init */
export interface MultipartInitUploadRequestDto {
  kind: "video" | "thumbnail";
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

/** Response for POST /admin/uploads/multipart/init */
export interface MultipartInitUploadResponseDto {
  uploadId: string;
  key: string;
  partSizeBytes: number;
  expiresAt: string;
  publicUrl?: string;
}

/** Request body for POST /admin/uploads/multipart/part-url */
export interface MultipartPartUrlRequestDto {
  key: string;
  uploadId: string;
  partNumber: number;
}

/** Response for POST /admin/uploads/multipart/part-url */
export interface MultipartPartUrlResponseDto {
  partNumber: number;
  url: string;
  expiresAt: string;
}

export interface MultipartCompletedPartDto {
  partNumber: number;
  etag: string;
}

/** Request body for POST /admin/uploads/multipart/complete */
export interface MultipartCompleteUploadRequestDto {
  key: string;
  uploadId: string;
  parts: MultipartCompletedPartDto[];
}

/** Request body for POST /admin/uploads/multipart/abort */
export interface MultipartAbortUploadRequestDto {
  key: string;
  uploadId: string;
}

export interface CreateAdminSeasonRequestDto {
  contentId: string;
  seasonNumber: number;
  title: string;
  description?: string;
}

export interface CreateAdminEpisodeRequestDto {
  contentId: string;
  seasonId?: string;
  episodeNumber: number;
  title: string;
  description?: string;
  duration: string;
  videoKey: string;
  hlsKey?: string;
  thumbnailKey?: string;
}

export interface CreateAdminTrailerRequestDto {
  title: string;
  description?: string;
  thumbnailKey: string;
  posterKey?: string;
  releaseYear: number;
  ageRating: string;
  duration: string;
  videoKey: string;
  hlsKey?: string;
  isPublished?: boolean;
}

/** Request body for PATCH /admin/content/:id */
export interface UpdateAdminContentRequestDto {
  title?: string;
  description?: string;
  type?: ContentType;
  thumbnailKey?: string;
  posterKey?: string;
  releaseYear?: number;
  ageRating?: string;
  duration?: string;
  categoryId?: string;
  category?: string;
}

/** Request body for PATCH /admin/content/:id/publish */
export interface PublishAdminContentRequestDto {
  isPublished: boolean;
}

/** Admin category representation. */
export interface AdminCategoryDto {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

/** Request body for POST /admin/categories */
export interface CreateAdminCategoryRequestDto {
  name: string;
}

/** Response for POST /admin/content */
export interface CreateAdminContentResponseDto {
  content: ContentDetailDto;
}
