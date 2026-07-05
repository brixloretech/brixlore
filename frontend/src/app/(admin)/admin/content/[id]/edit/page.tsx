"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Loader,
} from "@/components/ui";
import { adminService } from "@/lib/services";
import { useAuth } from "@/contexts";
import {
  DEFAULT_VIDEO_UPLOAD_STRATEGY,
  waitForCloudflareStreamReady,
  uploadVideoFileWithStrategy,
} from "@/lib/multipart-upload";
import type { AdminCategoryDto, ContentType } from "@/types/api";
import { getVideoDuration, secondsToDuration } from "@/lib/video-utils";

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/mkv"];
const MAX_VIDEO_BYTES = 20 * 1024 * 1024 * 1024;
const THUMBNAIL_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

function isValidDuration(value: string): boolean {
  return /^\d{1,2}:\d{2}(?::\d{2})?$/.test(value.trim());
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function getCategoryOptions(list: AdminCategoryDto[]): AdminCategoryDto[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    const name = item.name.trim();
    if (!name) return false;
    const key = name.toLowerCase();
    if (key === "uncategorized") return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function AdminEditVideoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isReadOnly = user?.role === "CUSTOMER_SUPPORT";
  const params = useParams();
  const videoId = useMemo(() => {
    const raw = params?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<AdminCategoryDto[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<
    { id: string; seasonNumber: number; title: string; episodeCount: number; description?: string }[]
  >([]);
  const [episodes, setEpisodes] = useState<
    {
      id: string;
      seasonId?: string;
      episodeNumber: number;
      title: string;
      duration: string;
      hlsReady: boolean;
      thumbnailUrl?: string;
    }[]
  >([]);

  // Main Metadata States
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [published, setPublished] = useState(false);
  const [contentType, setContentType] = useState<ContentType>("MOVIE");
  const [releaseYear, setReleaseYear] = useState("");
  const [ageRating, setAgeRating] = useState("NR");

  // Artwork States
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(null);
  const [existingPosterUrl, setExistingPosterUrl] = useState<string | null>(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Movie Video File States
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [movieEpisode, setMovieEpisode] = useState<any | null>(null);
  const [movieVideoFile, setMovieVideoFile] = useState<File | null>(null);
  const [movieVideoProgress, setMovieVideoProgress] = useState<{ uploadedBytes: number; totalBytes: number } | null>(null);
  const [movieVideoProcessing, setMovieVideoProcessing] = useState(false);

  // Trailer States
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [existingTrailer, setExistingTrailer] = useState<any | null>(null);
  const [trailerVideoFile, setTrailerVideoFile] = useState<File | null>(null);
  const [trailerDuration, setTrailerDuration] = useState("");
  const [trailerVideoProgress, setTrailerVideoProgress] = useState<{ uploadedBytes: number; totalBytes: number } | null>(null);
  const [trailerVideoProcessing, setTrailerVideoProcessing] = useState(false);

  // Add Episode Form States
  const [seasonSelection, setSeasonSelection] = useState("new");
  const [seasonNumber, setSeasonNumber] = useState("1");
  const [seasonTitle, setSeasonTitle] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("1");
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodeDuration, setEpisodeDuration] = useState("");
  const [episodeFile, setEpisodeFile] = useState<File | null>(null);
  const [episodeThumbnailFile, setEpisodeThumbnailFile] = useState<File | null>(null);
  const [episodeThumbnailPreview, setEpisodeThumbnailPreview] = useState<string | null>(null);
  const [episodeSubmitting, setEpisodeSubmitting] = useState(false);
  const [episodeError, setEpisodeError] = useState<string | null>(null);
  const [episodeSuccess, setEpisodeSuccess] = useState<string | null>(null);
  const [episodeVideoProgress, setEpisodeVideoProgress] = useState<{
    uploadedBytes: number;
    totalBytes: number;
  } | null>(null);

  // CRUD Modals State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingSeason, setEditingSeason] = useState<any | null>(null);
  const [editSeasonNumber, setEditSeasonNumber] = useState("");
  const [editSeasonTitle, setEditSeasonTitle] = useState("");
  const [editSeasonDescription, setEditSeasonDescription] = useState("");
  const [editSeasonSubmitting, setEditSeasonSubmitting] = useState(false);
  const [editSeasonError, setEditSeasonError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingEpisode, setEditingEpisode] = useState<any | null>(null);
  const [editEpisodeNumber, setEditEpisodeNumber] = useState("");
  const [editEpisodeTitle, setEditEpisodeTitle] = useState("");
  const [editEpisodeDuration, setEditEpisodeDuration] = useState("");
  const [editEpisodeSeasonId, setEditEpisodeSeasonId] = useState("");
  const [editEpisodeFile, setEditEpisodeFile] = useState<File | null>(null);
  const [editEpisodeThumbnailFile, setEditEpisodeThumbnailFile] = useState<File | null>(null);
  const [editEpisodeThumbnailPreview, setEditEpisodeThumbnailPreview] = useState<string | null>(null);
  const [editEpisodeSubmitting, setEditEpisodeSubmitting] = useState(false);
  const [editEpisodeVideoProgress, setEditEpisodeVideoProgress] = useState<{ uploadedBytes: number; totalBytes: number } | null>(null);
  const [editEpisodeVideoProcessing, setEditEpisodeVideoProcessing] = useState(false);
  const [editEpisodeError, setEditEpisodeError] = useState<string | null>(null);

  const videoUploadStrategy = DEFAULT_VIDEO_UPLOAD_STRATEGY;

  const refreshContent = () => {
    if (!videoId) return;
    adminService
      .getContentItem(videoId)
      .then((item) => {
        if (!item) return;
        setTitle(item.title);
        setDuration(item.duration ?? "");
        setDescription(item.description ?? "");
        setCategory(item.category ?? "");
        setPublished(item.isPublished);
        setContentType(item.type as ContentType);
        setReleaseYear(String(item.releaseYear));
        setAgeRating(item.ageRating ?? "NR");
        setExistingThumbnailUrl(item.thumbnailUrl);
        setExistingPosterUrl(item.posterUrl ?? null);
        setExistingBannerUrl(item.bannerUrl ?? null);
        setSeasons(
          item.seasons?.map((season) => ({
            id: season.id,
            seasonNumber: season.seasonNumber,
            title: season.title,
            episodeCount: season.episodeCount ?? 0,
          })) ?? [],
        );
        setEpisodes(
          item.episodes?.map((ep) => ({
            id: ep.id,
            seasonId: ep.seasonId,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            duration: ep.duration,
            hlsReady: ep.hlsReady,
          })) ?? [],
        );

        if (item.episodes && item.episodes.length > 0 && (item.type === "MOVIE" || item.type === "SHORT" || item.type === "TRAILER")) {
          setMovieEpisode(item.episodes[0]);
        } else {
          setMovieEpisode(null);
        }

        if (item.trailer) {
          setExistingTrailer(item.trailer);
          setTrailerDuration(item.trailer.duration);
        } else {
          setExistingTrailer(null);
          setTrailerDuration("");
        }
      })
      .catch((err) => {
        console.error("Failed to refresh content:", err);
      });
  };

  useEffect(() => {
    if (!videoId) return;
    let active = true;
    setLoading(true);
    setError(null);
    adminService
      .getContentItem(videoId)
      .then((item) => {
        if (!active) return;
        if (!item) {
          setError("Content not found.");
          return;
        }
        setTitle(item.title);
        setDuration(item.duration ?? "");
        setDescription(item.description ?? "");
        setCategory(item.category ?? "");
        setPublished(item.isPublished);
        setContentType(item.type as ContentType);
        setReleaseYear(String(item.releaseYear));
        setAgeRating(item.ageRating ?? "NR");
        setExistingThumbnailUrl(item.thumbnailUrl);
        setExistingPosterUrl(item.posterUrl ?? null);
        setExistingBannerUrl(item.bannerUrl ?? null);
        setSeasons(
          item.seasons?.map((season) => ({
            id: season.id,
            seasonNumber: season.seasonNumber,
            title: season.title,
            episodeCount: season.episodeCount ?? 0,
          })) ?? [],
        );
        setEpisodes(
          item.episodes?.map((ep) => ({
            id: ep.id,
            seasonId: ep.seasonId,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            duration: ep.duration,
            hlsReady: ep.hlsReady,
          })) ?? [],
        );

        if (item.episodes && item.episodes.length > 0 && (item.type === "MOVIE" || item.type === "SHORT" || item.type === "TRAILER")) {
          setMovieEpisode(item.episodes[0]);
        } else {
          setMovieEpisode(null);
        }

        if (item.trailer) {
          setExistingTrailer(item.trailer);
          setTrailerDuration(item.trailer.duration);
        } else {
          setExistingTrailer(null);
          setTrailerDuration("");
        }

        if (item.seasons && item.seasons.length > 0) {
          setSeasonSelection(item.seasons[0].id);
          setSeasonNumber(String(item.seasons[0].seasonNumber));
          setSeasonTitle(item.seasons[0].title);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Failed to load content.",
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [videoId]);

  useEffect(() => {
    if (episodeThumbnailFile) {
      const url = URL.createObjectURL(episodeThumbnailFile);
      setEpisodeThumbnailPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setEpisodeThumbnailPreview(null);
    }
  }, [episodeThumbnailFile]);

  useEffect(() => {
    if (editEpisodeThumbnailFile) {
      const url = URL.createObjectURL(editEpisodeThumbnailFile);
      setEditEpisodeThumbnailPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setEditEpisodeThumbnailPreview(null);
    }
  }, [editEpisodeThumbnailFile]);

  useEffect(() => {
    if (thumbnailFile) {
      const url = URL.createObjectURL(thumbnailFile);
      setThumbnailPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setThumbnailPreview(null);
    }
  }, [thumbnailFile]);

  useEffect(() => {
    if (posterFile) {
      const url = URL.createObjectURL(posterFile);
      setPosterPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPosterPreview(null);
    }
  }, [posterFile]);

  useEffect(() => {
    if (bannerFile) {
      const url = URL.createObjectURL(bannerFile);
      setBannerPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setBannerPreview(null);
    }
  }, [bannerFile]);

  useEffect(() => {
    let active = true;
    setCategoriesLoading(true);
    setCategoriesError(null);
    adminService
      .getCategories()
      .then((list) => {
        if (!active) return;
        setCategories(list);
      })
      .catch((err) => {
        if (!active) return;
        setCategories([]);
        setCategoriesError(
          err instanceof Error ? err.message : "Failed to load categories.",
        );
      })
      .finally(() => {
        if (!active) return;
        setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function runValidation(): boolean {
    if (!title.trim()) {
      setError("Title is required.");
      return false;
    }
    if (duration.trim() && !isValidDuration(duration)) {
      setError("Duration must be MM:SS or HH:MM:SS.");
      return false;
    }
    if (!releaseYear.trim()) {
      setError("Release year is required.");
      return false;
    }
    if (!/^\d{4}$/.test(releaseYear.trim())) {
      setError("Release year must be a 4-digit year.");
      return false;
    }
    if (!ageRating.trim()) {
      setError("Age rating is required.");
      return false;
    }
    if (bannerFile && !THUMBNAIL_TYPES.includes(bannerFile.type)) {
      setError("Banner must be JPEG, PNG, or WebP.");
      return false;
    }
    setError(null);
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!videoId) return;
    if (isReadOnly) {
      setError("Customer Support accounts have read-only access.");
      return;
    }
    if (!runValidation()) return;
    setSaving(true);
    setMovieVideoProgress(null);
    setMovieVideoProcessing(false);
    setTrailerVideoProgress(null);
    setTrailerVideoProcessing(false);

    try {
      let thumbnailKey: string | undefined = undefined;
      let posterKey: string | undefined = undefined;
      let bannerKey: string | undefined = undefined;
      const uploads: Promise<Response>[] = [];

      // 1. Upload new Landscape Thumbnail if chosen
      if (thumbnailFile) {
        const thumbnailPresign = await adminService.presignUpload({
          kind: "thumbnail",
          fileName: thumbnailFile.name,
          contentType: thumbnailFile.type,
          sizeBytes: thumbnailFile.size,
        });
        thumbnailKey = thumbnailPresign.key;
        uploads.push(
          fetch(thumbnailPresign.url, {
            method: "PUT",
            headers: { "Content-Type": thumbnailFile.type },
            body: thumbnailFile,
          })
        );
      }

      // 2. Upload new Portrait Poster if chosen
      if (posterFile) {
        const posterPresign = await adminService.presignUpload({
          kind: "thumbnail",
          fileName: posterFile.name,
          contentType: posterFile.type,
          sizeBytes: posterFile.size,
        });
        posterKey = posterPresign.key;
        uploads.push(
          fetch(posterPresign.url, {
            method: "PUT",
            headers: { "Content-Type": posterFile.type },
            body: posterFile,
          })
        );
      }

      // 2.5. Upload new Landscape Banner if chosen
      if (bannerFile) {
        const bannerPresign = await adminService.presignUpload({
          kind: "thumbnail",
          fileName: bannerFile.name,
          contentType: bannerFile.type,
          sizeBytes: bannerFile.size,
        });
        bannerKey = bannerPresign.key;
        uploads.push(
          fetch(bannerPresign.url, {
            method: "PUT",
            headers: { "Content-Type": bannerFile.type },
            body: bannerFile,
          })
        );
      }

      if (uploads.length > 0) {
        const responses = await Promise.all(uploads);
        const failed = responses.find((res) => !res.ok);
        if (failed) {
          const message = await failed.text();
          throw new Error(message || "Image upload failed");
        }
      }

      // 3. Update main Content item metadata
      await adminService.updateContent(videoId, {
        title: title.trim(),
        duration: duration.trim() || undefined,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        type: contentType,
        releaseYear: Number(releaseYear),
        ageRating: ageRating.trim(),
        thumbnailKey,
        posterKey,
        bannerKey,
      });

      // 4. Upload & Update Movie/Short primary video file if chosen
      if (movieVideoFile && movieEpisode) {
        setMovieVideoProgress({ uploadedBytes: 0, totalBytes: movieVideoFile.size });
        const uploadedVideo = await uploadVideoFileWithStrategy({
          file: movieVideoFile,
          strategy: videoUploadStrategy,
          onProgress: (uploadedBytes, totalBytes) =>
            setMovieVideoProgress({ uploadedBytes, totalBytes }),
        });

        if (uploadedVideo.cloudflareStream) {
          setMovieVideoProgress(null);
          setMovieVideoProcessing(true);
          await waitForCloudflareStreamReady(uploadedVideo.key);
          setMovieVideoProcessing(false);
        }

        await adminService.updateEpisode(movieEpisode.id, {
          videoKey: uploadedVideo.key,
          duration: duration.trim() || undefined,
        });
      }

      // 5. Upload & Create or Update Series/Doc Trailer if chosen
      if (trailerVideoFile) {
        if (!trailerDuration.trim() || !isValidDuration(trailerDuration)) {
          throw new Error("Please specify a valid trailer duration (MM:SS or HH:MM:SS)");
        }

        setTrailerVideoProgress({ uploadedBytes: 0, totalBytes: trailerVideoFile.size });
        const uploadedTrailer = await uploadVideoFileWithStrategy({
          file: trailerVideoFile,
          strategy: videoUploadStrategy,
          onProgress: (uploadedBytes, totalBytes) =>
            setTrailerVideoProgress({ uploadedBytes, totalBytes }),
        });

        if (uploadedTrailer.cloudflareStream) {
          setTrailerVideoProgress(null);
          setTrailerVideoProcessing(true);
          await waitForCloudflareStreamReady(uploadedTrailer.key);
          setTrailerVideoProcessing(false);
        }

        if (existingTrailer) {
          // Update existing trailer episode
          await adminService.updateEpisode(existingTrailer.episodeId, {
            videoKey: uploadedTrailer.key,
            duration: trailerDuration.trim(),
          });
          // Update trailer content
          await adminService.updateContent(existingTrailer.id, {
            duration: trailerDuration.trim(),
            bannerKey: bannerKey ?? undefined,
          });
        } else {
          // Create new trailer
          await adminService.createTrailer(videoId, {
            title: `${title.trim()} Trailer`,
            duration: trailerDuration.trim(),
            videoKey: uploadedTrailer.key,
            thumbnailKey: thumbnailKey ?? existingThumbnailUrl!,
            posterKey: posterKey ?? existingPosterUrl ?? undefined,
            bannerKey: bannerKey ?? existingBannerUrl ?? undefined,
            releaseYear: Number(releaseYear),
            ageRating: ageRating.trim(),
          });
        }
      } else if (existingTrailer && trailerDuration.trim() && trailerDuration.trim() !== existingTrailer.duration) {
        // Just update trailer duration metadata if duration text changed without uploading new video
        if (!isValidDuration(trailerDuration)) {
          throw new Error("Please specify a valid trailer duration (MM:SS or HH:MM:SS)");
        }
        await adminService.updateEpisode(existingTrailer.episodeId, {
          duration: trailerDuration.trim(),
        });
        await adminService.updateContent(existingTrailer.id, {
          duration: trailerDuration.trim(),
        });
      }

      await adminService.publishContent(videoId, { isPublished: published });
      router.push("/admin/content");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update content.",
      );
    } finally {
      setSaving(false);
      setMovieVideoProgress(null);
      setMovieVideoProcessing(false);
      setTrailerVideoProgress(null);
      setTrailerVideoProcessing(false);
    }
  }

  // Season & Episode Handlers
  async function handleUpdateSeason(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSeason || isReadOnly) return;
    setEditSeasonSubmitting(true);
    setEditSeasonError(null);

    try {
      await adminService.updateSeason(editingSeason.id, {
        seasonNumber: Number(editSeasonNumber),
        title: editSeasonTitle.trim(),
        description: editSeasonDescription.trim() || undefined,
      });
      refreshContent();
      setEditingSeason(null);
    } catch (err) {
      setEditSeasonError(
        err instanceof Error ? err.message : "Failed to update season."
      );
    } finally {
      setEditSeasonSubmitting(false);
    }
  }

  async function handleDeleteSeason(seasonId: string) {
    if (isReadOnly) return;
    if (!confirm("Are you sure you want to delete this season? This will cascade delete ALL episodes inside this season!")) {
      return;
    }
    try {
      await adminService.deleteSeason(seasonId);
      refreshContent();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete season.");
    }
  }

  async function handleUpdateEpisode(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEpisode || isReadOnly) return;
    setEditEpisodeSubmitting(true);
    setEditEpisodeError(null);
    setEditEpisodeVideoProgress(null);
    setEditEpisodeVideoProcessing(false);

    try {
      let thumbnailKey: string | undefined = undefined;
      let videoKey: string | undefined = undefined;

      // 1. Upload new episode thumbnail if chosen
      if (editEpisodeThumbnailFile) {
        const thumbnailPresign = await adminService.presignUpload({
          kind: "thumbnail",
          fileName: editEpisodeThumbnailFile.name,
          contentType: editEpisodeThumbnailFile.type,
          sizeBytes: editEpisodeThumbnailFile.size,
        });
        thumbnailKey = thumbnailPresign.key;
        const thumbnailRes = await fetch(thumbnailPresign.url, {
          method: "PUT",
          headers: { "Content-Type": editEpisodeThumbnailFile.type },
          body: editEpisodeThumbnailFile,
        });
        if (!thumbnailRes.ok) {
          throw new Error("Episode thumbnail upload failed.");
        }
      }

      // 2. Upload new video file if chosen
      if (editEpisodeFile) {
        setEditEpisodeVideoProgress({ uploadedBytes: 0, totalBytes: editEpisodeFile.size });
        const uploadedVideo = await uploadVideoFileWithStrategy({
          file: editEpisodeFile,
          strategy: videoUploadStrategy,
          onProgress: (uploadedBytes, totalBytes) =>
            setEditEpisodeVideoProgress({ uploadedBytes, totalBytes }),
        });

        if (uploadedVideo.cloudflareStream) {
          setEditEpisodeVideoProgress(null);
          setEditEpisodeVideoProcessing(true);
          await waitForCloudflareStreamReady(uploadedVideo.key);
          setEditEpisodeVideoProcessing(false);
        }
        videoKey = uploadedVideo.key;
      }

      // 3. Submit API update
      await adminService.updateEpisode(editingEpisode.id, {
        episodeNumber: Number(editEpisodeNumber),
        title: editEpisodeTitle.trim(),
        duration: editEpisodeDuration.trim(),
        seasonId: editEpisodeSeasonId === "none" ? null : editEpisodeSeasonId,
        thumbnailKey,
        videoKey,
      });

      refreshContent();
      setEditingEpisode(null);
    } catch (err) {
      setEditEpisodeError(
        err instanceof Error ? err.message : "Failed to update episode."
      );
    } finally {
      setEditEpisodeSubmitting(false);
      setEditEpisodeVideoProgress(null);
      setEditEpisodeVideoProcessing(false);
    }
  }

  async function handleDeleteEpisode(episodeId: string) {
    if (isReadOnly) return;
    if (!confirm("Are you sure you want to delete this episode?")) {
      return;
    }
    try {
      await adminService.deleteEpisode(episodeId);
      refreshContent();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete episode.");
    }
  }

  async function handleAddEpisode(e: React.FormEvent) {
    e.preventDefault();
    if (!videoId) return;
    if (isReadOnly) {
      setEpisodeError("Customer Support accounts have read-only access.");
      return;
    }
    setEpisodeError(null);
    setEpisodeSuccess(null);

    if (!episodeTitle.trim()) {
      setEpisodeError("Episode title is required.");
      return;
    }
    if (!/^\d+$/.test(episodeNumber.trim())) {
      setEpisodeError("Episode number must be a number.");
      return;
    }
    if (seasonSelection === "new" && !/^\d+$/.test(seasonNumber.trim())) {
      setEpisodeError("Season number must be a number.");
      return;
    }
    if (!episodeDuration.trim() || !isValidDuration(episodeDuration)) {
      setEpisodeError("Episode duration must be MM:SS or HH:MM:SS.");
      return;
    }
    if (!episodeFile) {
      setEpisodeError("Please select an episode video file.");
      return;
    }
    if (!VIDEO_TYPES.includes(episodeFile.type)) {
      setEpisodeError("Episode video must be MP4, WebM, or MKV.");
      return;
    }
    if (episodeFile.size > MAX_VIDEO_BYTES) {
      setEpisodeError(`Episode video exceeds ${formatBytes(MAX_VIDEO_BYTES)}.`);
      return;
    }
    if (
      episodeThumbnailFile &&
      !THUMBNAIL_TYPES.includes(episodeThumbnailFile.type)
    ) {
      setEpisodeError("Episode thumbnail must be PNG, JPG, or WebP.");
      return;
    }
    setEpisodeSubmitting(true);
    setEpisodeVideoProgress({ uploadedBytes: 0, totalBytes: episodeFile.size });
    try {
      const uploadedVideo = await uploadVideoFileWithStrategy({
        file: episodeFile,
        strategy: videoUploadStrategy,
        onProgress: (uploadedBytes, totalBytes) =>
          setEpisodeVideoProgress({ uploadedBytes, totalBytes }),
      });

      if (uploadedVideo.cloudflareStream) {
        await waitForCloudflareStreamReady(uploadedVideo.key);
      }

      let thumbnailKey: string | undefined;
      if (episodeThumbnailFile) {
        const thumbnailPresign = await adminService.presignUpload({
          kind: "thumbnail",
          fileName: episodeThumbnailFile.name,
          contentType: episodeThumbnailFile.type,
          sizeBytes: episodeThumbnailFile.size,
        });

        const thumbnailUploadRes = await fetch(thumbnailPresign.url, {
          method: "PUT",
          headers: { "Content-Type": episodeThumbnailFile.type },
          body: episodeThumbnailFile,
        });
        if (!thumbnailUploadRes.ok) {
          const message = await thumbnailUploadRes.text();
          throw new Error(message || "Thumbnail upload failed");
        }
        thumbnailKey = thumbnailPresign.key;
      }

      let seasonId = seasonSelection;
      if (seasonSelection === "new") {
        const parsedSeason = Number(seasonNumber) || 1;
        const createdSeason = await adminService.createSeason({
          contentId: videoId,
          seasonNumber: parsedSeason,
          title: seasonTitle.trim() || `Season ${parsedSeason}`,
        });
        seasonId = createdSeason.id;
      }

      await adminService.createEpisode({
        contentId: videoId,
        seasonId: seasonId === "new" ? undefined : seasonId,
        episodeNumber: Number(episodeNumber),
        title: episodeTitle.trim(),
        duration: episodeDuration.trim(),
        videoKey: uploadedVideo.key,
        thumbnailKey,
      });

      refreshContent();
      setEpisodeSuccess("Episode added successfully.");
      setEpisodeTitle("");
      setEpisodeNumber(String(Number(episodeNumber) + 1));
      setEpisodeDuration("");
      setEpisodeFile(null);
      setEpisodeThumbnailFile(null);
      setEpisodeThumbnailPreview(null);
    } catch (err) {
      setEpisodeError(
        err instanceof Error ? err.message : "Failed to add episode.",
      );
    } finally {
      setEpisodeSubmitting(false);
      setEpisodeVideoProgress(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-neutral-700/50 bg-neutral-900/50 py-12">
        <Loader size="lg" label="Loading content…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-4 text-sm text-red-300">
        {error}
      </div>
    );
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Edit content
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Update metadata, artwork, video assets, and publishing status.
        </p>
      </header>

      <div className="space-y-6">
        {isReadOnly ? (
          <div className="rounded-xl border border-neutral-700/60 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-300">
            Read-only access: Customer Support accounts can view content details
            but cannot edit or publish changes.
          </div>
        ) : null}

        <Card className="max-w-lg">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Content details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <p
                  className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <Input
                label="Title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Video title"
                required
                disabled={isReadOnly || saving}
              />
              <div>
                <label
                  htmlFor="content-type"
                  className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Content type
                </label>
                <select
                  id="content-type"
                  value={contentType}
                  onChange={(e) =>
                    setContentType(e.target.value as ContentType)
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
                  disabled={isReadOnly || saving}
                >
                  {[
                    "MOVIE",
                    "DOCUMENTARY",
                    "SERIES",
                    "ANIMATION",
                    "SHORT",
                    "TRAILER",
                  ].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Release year"
                type="text"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                placeholder="2024"
                required
                disabled={isReadOnly || saving}
              />
              <div>
                <label
                  htmlFor="age-rating"
                  className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Age rating
                </label>
                <select
                  id="age-rating"
                  value={ageRating}
                  onChange={(e) => setAgeRating(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
                  disabled={isReadOnly || saving}
                >
                  {["G", "PG", "PG-13", "R", "TV-MA", "NR"].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Duration"
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 12:34 or 1:22:10"
                hint="Format: MM:SS or HH:MM:SS"
                disabled={isReadOnly || saving}
              />

              {/* Movie / Short Video File Replacement */}
              {(contentType === "MOVIE" || contentType === "SHORT") && (
                <div className="space-y-3 rounded-lg border border-neutral-700 bg-neutral-900/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    Video File
                  </p>
                  {movieEpisode ? (
                    <div className="text-xs text-neutral-300">
                      Current Video Status:{" "}
                      <span className={`font-semibold ${movieEpisode.hlsReady ? "text-emerald-400" : "text-amber-400"}`}>
                        {movieEpisode.hlsReady ? "Transcoded & Ready (HLS)" : "Processing / Missing HLS"}
                      </span>
                    </div>
                  ) : null}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-400">
                      Replace video file
                    </label>
                    <input
                      type="file"
                      accept={VIDEO_TYPES.join(",")}
                      onChange={async (e) => {
                        const file = e.target.files?.[0] ?? null;
                        setMovieVideoFile(file);
                        if (file) {
                          const dur = await getVideoDuration(file);
                          if (dur > 0) setDuration(secondsToDuration(dur));
                        }
                      }}
                      className="w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-700 file:px-3 file:py-1.5 file:text-sm text-neutral-100"
                      disabled={isReadOnly || saving}
                    />
                    {movieVideoProgress && (
                      <div className="mt-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                        <div className="mb-1 flex items-center justify-between">
                          <span>Video upload progress</span>
                          <span>
                            {Math.round((movieVideoProgress.uploadedBytes / movieVideoProgress.totalBytes) * 100)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded bg-neutral-800">
                          <div
                            className="h-1.5 rounded bg-cyan-400"
                            style={{
                              width: `${(movieVideoProgress.uploadedBytes / movieVideoProgress.totalBytes) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {movieVideoProcessing && (
                      <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                        Processing video on Cloudflare Stream. Please wait...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Artwork Editing Section */}
              <div className="pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Artwork
              </div>
              
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Thumbnail image (Landscape - Card)
                </label>
                {thumbnailPreview ? (
                  <div className="mb-3">
                    <Image
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="max-h-32 rounded-lg border border-neutral-700"
                      width={228}
                      height={128}
                      unoptimized
                    />
                  </div>
                ) : existingThumbnailUrl ? (
                  <div className="mb-3">
                    <img
                      src={existingThumbnailUrl}
                      alt="Current thumbnail"
                      className="max-h-32 rounded-lg border border-neutral-700"
                    />
                  </div>
                ) : null}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-200 file:px-3 file:py-1.5 file:text-sm file:text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:file:bg-neutral-700 dark:file:text-neutral-100"
                  disabled={isReadOnly || saving}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Poster image (Portrait - Banner)
                </label>
                {posterPreview ? (
                  <div className="mb-3">
                    <Image
                      src={posterPreview}
                      alt="Poster preview"
                      className="max-h-32 rounded-lg border border-neutral-700"
                      width={90}
                      height={128}
                      unoptimized
                    />
                  </div>
                ) : existingPosterUrl ? (
                  <div className="mb-3">
                    <img
                      src={existingPosterUrl}
                      alt="Current poster"
                      className="max-h-32 rounded-lg border border-neutral-700"
                    />
                  </div>
                ) : null}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-200 file:px-3 file:py-1.5 file:text-sm file:text-neutral-950 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:file:bg-neutral-700 dark:file:text-neutral-105"
                  disabled={isReadOnly || saving}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Banner image (Landscape - Widescreen Slideshow)
                </label>
                {bannerPreview ? (
                  <div className="mb-3">
                     <Image
                       src={bannerPreview}
                       alt="Banner preview"
                       className="max-h-32 rounded-lg border border-neutral-700"
                       width={228}
                       height={128}
                       unoptimized
                     />
                  </div>
                ) : existingBannerUrl ? (
                  <div className="mb-3">
                    <img
                      src={existingBannerUrl}
                      alt="Current banner"
                      className="max-h-32 rounded-lg border border-neutral-700"
                    />
                  </div>
                ) : null}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-200 file:px-3 file:py-1.5 file:text-sm file:text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:file:bg-neutral-700 dark:file:text-neutral-100"
                  disabled={isReadOnly || saving}
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
                  disabled={isReadOnly || saving}
                >
                  <option value="">Select category</option>
                  <option value="Uncategorized">Uncategorized</option>
                  {getCategoryOptions(categories).map((opt) => (
                    <option key={opt.id} value={opt.name}>
                      {opt.name}
                    </option>
                  ))}
                </select>
                {categoriesLoading ? (
                  <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    Loading categories…
                  </p>
                ) : categoriesError ? (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">
                    {categoriesError}
                  </p>
                ) : categories.length === 0 ? (
                  <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    No categories yet. Create one in the Categories page.
                  </p>
                ) : null}
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400"
                  placeholder="Optional description"
                  disabled={isReadOnly || saving}
                />
              </div>
              <div>
                <label
                  htmlFor="published"
                  className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Status
                </label>
                <select
                  id="published"
                  value={published ? "published" : "unpublished"}
                  onChange={(e) => setPublished(e.target.value === "published")}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
                  disabled={isReadOnly || saving}
                >
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="space-x-3">
              <Button type="submit" disabled={saving || isReadOnly}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/content")}
                disabled={saving}
              >
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Series/Doc Trailer Section */}
        {(contentType === "SERIES" || contentType === "DOCUMENTARY") && (
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Trailer Management</CardTitle>
              <p className="mt-1 text-sm text-neutral-400">
                {existingTrailer ? "Update or replace the trailer." : "Upload a trailer for this content item."}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {existingTrailer && (
                <div className="text-xs text-neutral-300">
                  Current Trailer Status:{" "}
                  <span className={`font-semibold ${existingTrailer.hlsUrl ? "text-emerald-400" : "text-amber-400"}`}>
                    {existingTrailer.hlsUrl ? "Transcoded & Ready (HLS)" : "Processing / Missing HLS"}
                  </span>
                </div>
              )}
              <Input
                label="Trailer duration"
                type="text"
                value={trailerDuration}
                onChange={(e) => setTrailerDuration(e.target.value)}
                placeholder="e.g. 02:15"
                hint="Format: MM:SS or HH:MM:SS"
                disabled={isReadOnly || saving}
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Trailer video file
                </label>
                <input
                  type="file"
                  accept={VIDEO_TYPES.join(",")}
                  onChange={async (e) => {
                    const file = e.target.files?.[0] ?? null;
                    setTrailerVideoFile(file);
                    if (file) {
                      const dur = await getVideoDuration(file);
                      if (dur > 0) setTrailerDuration(secondsToDuration(dur));
                    }
                  }}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-200 file:px-3 file:py-1.5 file:text-sm file:text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:file:bg-neutral-700 dark:file:text-neutral-100"
                  disabled={isReadOnly || saving}
                />
                {trailerVideoProgress && (
                  <div className="mt-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                    <div className="mb-1 flex items-center justify-between">
                      <span>Trailer upload progress</span>
                      <span>
                        {Math.round((trailerVideoProgress.uploadedBytes / trailerVideoProgress.totalBytes) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded bg-neutral-800">
                      <div
                        className="h-1.5 rounded bg-cyan-400"
                        style={{
                          width: `${(trailerVideoProgress.uploadedBytes / trailerVideoProgress.totalBytes) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {trailerVideoProcessing && (
                  <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    Processing trailer on Cloudflare Stream. Please wait...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Add episode</CardTitle>
            <p className="mt-1 text-sm text-neutral-400">
              Upload and attach a new episode to this content.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {contentType !== "SERIES" &&
            contentType !== "ANIMATION" &&
            contentType !== "DOCUMENTARY" ? (
              <p className="text-sm text-neutral-500">
                Episodes are available for Series, Animation, or Documentary
                content types.
              </p>
            ) : (
              <form onSubmit={handleAddEpisode} className="space-y-4">
                {episodeError && (
                  <p
                    className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400"
                    role="alert"
                  >
                    {episodeError}
                  </p>
                )}
                {episodeSuccess && (
                  <p className="rounded-lg bg-emerald-950/50 px-3 py-2 text-sm text-emerald-300">
                    {episodeSuccess}
                  </p>
                )}
                <p className="text-xs text-neutral-400">
                  Video upload mode:{" "}
                  <span className="font-semibold text-neutral-200">
                    {videoUploadStrategy}
                  </span>
                </p>
                {episodeSubmitting && episodeVideoProgress && (
                  <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                    <div className="mb-1 flex items-center justify-between">
                      <span>Episode video upload</span>
                      <span>
                        {Math.min(
                          100,
                          Math.round(
                            (episodeVideoProgress.uploadedBytes /
                              Math.max(1, episodeVideoProgress.totalBytes)) *
                              100,
                          ),
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded bg-neutral-800">
                      <div
                        className="h-1.5 rounded bg-cyan-400"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (episodeVideoProgress.uploadedBytes /
                                Math.max(1, episodeVideoProgress.totalBytes)) *
                                100,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-cyan-200/90">
                      {formatBytes(episodeVideoProgress.uploadedBytes)} /{" "}
                      {formatBytes(episodeVideoProgress.totalBytes)} via{" "}
                      {videoUploadStrategy}
                    </p>
                  </div>
                )}
                <div>
                  <label
                    htmlFor="season-select"
                    className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Season
                  </label>
                  <select
                    id="season-select"
                    value={seasonSelection}
                    onChange={(e) => setSeasonSelection(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
                    disabled={isReadOnly || episodeSubmitting}
                  >
                    <option value="new">Create new season</option>
                    {seasons.map((season) => (
                      <option key={season.id} value={season.id}>
                        Season {season.seasonNumber}: {season.title}
                      </option>
                    ))}
                  </select>
                </div>
                {seasonSelection === "new" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Season number"
                      type="text"
                      value={seasonNumber}
                      onChange={(e) => setSeasonNumber(e.target.value)}
                      placeholder="1"
                      disabled={isReadOnly || episodeSubmitting}
                    />
                    <Input
                      label="Season title"
                      type="text"
                      value={seasonTitle}
                      onChange={(e) => setSeasonTitle(e.target.value)}
                      placeholder="Season 1"
                      disabled={isReadOnly || episodeSubmitting}
                    />
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Episode number"
                    type="text"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(e.target.value)}
                    placeholder="1"
                    disabled={isReadOnly || episodeSubmitting}
                  />
                  <Input
                    label="Episode title"
                    type="text"
                    value={episodeTitle}
                    onChange={(e) => setEpisodeTitle(e.target.value)}
                    placeholder="Episode 1"
                    disabled={isReadOnly || episodeSubmitting}
                  />
                </div>
                <Input
                  label="Episode duration"
                  type="text"
                  value={episodeDuration}
                  onChange={(e) => setEpisodeDuration(e.target.value)}
                  placeholder="e.g. 24:00"
                  hint="Format: MM:SS or HH:MM:SS"
                  disabled={isReadOnly || episodeSubmitting}
                />
                <div>
                  <label
                    htmlFor="episode-file"
                    className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Episode video file
                  </label>
                  <input
                    id="episode-file"
                    type="file"
                    accept={VIDEO_TYPES.join(",")}
                    onChange={async (e) => {
                      const file = e.target.files?.[0] ?? null;
                      setEpisodeFile(file);
                      if (file) {
                        const dur = await getVideoDuration(file);
                        if (dur > 0) setEpisodeDuration(secondsToDuration(dur));
                      }
                    }}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-200 file:px-3 file:py-1.5 file:text-sm file:text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:file:bg-neutral-700 dark:file:text-neutral-100"
                    disabled={isReadOnly || episodeSubmitting}
                  />
                  <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    MP4, WebM, or MKV. Max {formatBytes(MAX_VIDEO_BYTES)}.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="episode-thumbnail-file"
                    className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Episode thumbnail (optional)
                  </label>
                  <input
                    id="episode-thumbnail-file"
                    type="file"
                    accept={THUMBNAIL_TYPES.join(",")}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setEpisodeThumbnailFile(file);
                      setEpisodeError(null);
                    }}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-200 file:px-3 file:py-1.5 file:text-sm file:text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:file:bg-neutral-700 dark:file:text-neutral-100"
                    disabled={isReadOnly || episodeSubmitting}
                  />
                  <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    PNG, JPG, or WebP. Recommended: 16:9 aspect ratio.
                  </p>
                  {episodeThumbnailPreview && (
                    <div className="mt-3">
                      <Image
                        src={episodeThumbnailPreview}
                        alt="Episode thumbnail preview"
                        className="max-h-32 rounded-lg border border-neutral-300 dark:border-neutral-700"
                        width={228}
                        height={128}
                        unoptimized
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 font-medium">
                  <Button
                    type="submit"
                    disabled={episodeSubmitting || isReadOnly}
                  >
                    {episodeSubmitting ? "Uploading…" : "Add episode"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isReadOnly || episodeSubmitting}
                    onClick={() => {
                      setEpisodeTitle("");
                      setEpisodeDuration("");
                      setEpisodeNumber("1");
                      setEpisodeFile(null);
                      setEpisodeThumbnailFile(null);
                      setEpisodeThumbnailPreview(null);
                      setEpisodeError(null);
                      setEpisodeSuccess(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Existing Episodes & Seasons */}
        {(contentType === "SERIES" ||
          contentType === "ANIMATION" ||
          contentType === "DOCUMENTARY") &&
        (seasons.length > 0 || episodes.length > 0) ? (
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Episodes & Seasons</CardTitle>
              <p className="mt-1 text-sm text-neutral-400">
                {seasons.length > 0
                  ? `${seasons.length} season${seasons.length === 1 ? "" : "s"}`
                  : ""}
                {seasons.length > 0 && episodes.length > 0 ? " • " : ""}
                {episodes.length > 0
                  ? `${episodes.length} episode${episodes.length === 1 ? "" : "s"}`
                  : ""}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {seasons.length > 0 ? (
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-neutral-500">
                    Seasons
                  </h3>
                  <div className="space-y-2">
                    {seasons
                      .sort((a, b) => a.seasonNumber - b.seasonNumber)
                      .map((season) => {
                        const seasonEpisodes = episodes.filter(
                          (e) => e.seasonId === season.id,
                        );
                        return (
                          <div
                            key={season.id}
                            className="rounded-lg border border-neutral-700/60 bg-neutral-900/60 px-4 py-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-white">
                                  Season {season.seasonNumber}: {season.title}
                                </p>
                                <p className="mt-1 text-xs text-neutral-400">
                                  {seasonEpisodes.length} episode
                                  {seasonEpisodes.length === 1 ? "" : "s"}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  disabled={isReadOnly}
                                  onClick={() => {
                                    setEditingSeason(season);
                                    setEditSeasonNumber(String(season.seasonNumber));
                                    setEditSeasonTitle(season.title);
                                    setEditSeasonDescription(season.description || "");
                                    setEditSeasonError(null);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300 border-red-900/50 hover:bg-red-950/20"
                                  disabled={isReadOnly}
                                  onClick={() => handleDeleteSeason(season.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                            {seasonEpisodes.length > 0 && (
                              <div className="mt-3 space-y-1.5 border-t border-neutral-700/60 pt-3">
                                {seasonEpisodes
                                  .sort(
                                    (a, b) => a.episodeNumber - b.episodeNumber,
                                  )
                                  .map((ep) => (
                                    <div
                                      key={ep.id}
                                      className="flex items-center justify-between rounded px-2 py-1.5 text-sm text-neutral-300"
                                    >
                                      <span>
                                        E{ep.episodeNumber}: {ep.title}
                                      </span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs text-neutral-500">
                                          {ep.duration}
                                        </span>
                                        <span className={`text-xs font-semibold ${ep.hlsReady ? "text-emerald-500" : "text-amber-500"}`}>
                                          {ep.hlsReady ? "Ready" : "Transcoding"}
                                        </span>
                                        <div className="flex gap-1.5">
                                          <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="h-7 px-2 text-xs"
                                            disabled={isReadOnly}
                                            onClick={() => {
                                              setEditingEpisode(ep);
                                              setEditEpisodeNumber(String(ep.episodeNumber));
                                              setEditEpisodeTitle(ep.title);
                                              setEditEpisodeDuration(ep.duration);
                                              setEditEpisodeSeasonId(ep.seasonId || "none");
                                              setEditEpisodeFile(null);
                                              setEditEpisodeThumbnailFile(null);
                                              setEditEpisodeThumbnailPreview(null);
                                              setEditEpisodeError(null);
                                            }}
                                          >
                                            Edit
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-xs text-red-400 hover:text-red-300 border-red-900/50 hover:bg-red-950/20"
                                            disabled={isReadOnly}
                                            onClick={() => handleDeleteEpisode(ep.id)}
                                          >
                                            Delete
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : null}
              {episodes.filter((e) => !e.seasonId).length > 0 ? (
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-neutral-500">
                    Episodes (No Season)
                  </h3>
                  <div className="space-y-1.5">
                    {episodes
                      .filter((e) => !e.seasonId)
                      .sort((a, b) => a.episodeNumber - b.episodeNumber)
                      .map((ep) => (
                        <div
                          key={ep.id}
                          className="flex items-center justify-between rounded-lg border border-neutral-700/60 bg-neutral-900/60 px-4 py-2.5 text-sm"
                        >
                          <span className="text-neutral-200">
                            Episode {ep.episodeNumber}: {ep.title}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-neutral-400">
                              {ep.duration}
                            </span>
                            <span className={`text-xs font-semibold ${ep.hlsReady ? "text-emerald-500" : "text-amber-500"}`}>
                              {ep.hlsReady ? "Ready" : "Transcoding"}
                            </span>
                            <div className="flex gap-1.5">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                disabled={isReadOnly}
                                onClick={() => {
                                  setEditingEpisode(ep);
                                  setEditEpisodeNumber(String(ep.episodeNumber));
                                  setEditEpisodeTitle(ep.title);
                                  setEditEpisodeDuration(ep.duration);
                                  setEditEpisodeSeasonId(ep.seasonId || "none");
                                  setEditEpisodeFile(null);
                                  setEditEpisodeThumbnailFile(null);
                                  setEditEpisodeThumbnailPreview(null);
                                  setEditEpisodeError(null);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs text-red-400 hover:text-red-300 border-red-900/50 hover:bg-red-950/20"
                                disabled={isReadOnly}
                                onClick={() => handleDeleteEpisode(ep.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Edit Season Modal */}
      {editingSeason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-neutral-900 border-neutral-700">
            <form onSubmit={handleUpdateSeason}>
              <CardHeader>
                <CardTitle>Edit Season Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editSeasonError && (
                  <p className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400" role="alert">
                    {editSeasonError}
                  </p>
                )}
                <Input
                  label="Season Number"
                  type="text"
                  value={editSeasonNumber}
                  onChange={(e) => setEditSeasonNumber(e.target.value)}
                  required
                />
                <Input
                  label="Season Title"
                  type="text"
                  value={editSeasonTitle}
                  onChange={(e) => setEditSeasonTitle(e.target.value)}
                  required
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                    Description
                  </label>
                  <textarea
                    value={editSeasonDescription}
                    onChange={(e) => setEditSeasonDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500"
                    placeholder="Optional description"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditingSeason(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editSeasonSubmitting}>
                  {editSeasonSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Episode Modal */}
      {editingEpisode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-md my-8 bg-neutral-900 border-neutral-700">
            <form onSubmit={handleUpdateEpisode}>
              <CardHeader>
                <CardTitle>Edit Episode Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {editEpisodeError && (
                  <p className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400" role="alert">
                    {editEpisodeError}
                  </p>
                )}
                <div className="grid gap-3 grid-cols-2">
                  <Input
                    label="Episode number"
                    type="text"
                    value={editEpisodeNumber}
                    onChange={(e) => setEditEpisodeNumber(e.target.value)}
                    required
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                      Season
                    </label>
                    <select
                      value={editEpisodeSeasonId}
                      onChange={(e) => setEditEpisodeSeasonId(e.target.value)}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100"
                    >
                      <option value="none">No Season</option>
                      {seasons.map((season) => (
                        <option key={season.id} value={season.id}>
                          Season {season.seasonNumber}: {season.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input
                  label="Episode title"
                  type="text"
                  value={editEpisodeTitle}
                  onChange={(e) => setEditEpisodeTitle(e.target.value)}
                  required
                />
                <Input
                  label="Episode duration"
                  type="text"
                  value={editEpisodeDuration}
                  onChange={(e) => setEditEpisodeDuration(e.target.value)}
                  placeholder="e.g. 24:00"
                  hint="Format: MM:SS or HH:MM:SS"
                  required
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                    Replace thumbnail image (optional)
                  </label>
                  {editEpisodeThumbnailPreview ? (
                    <div className="mb-3">
                      <Image
                        src={editEpisodeThumbnailPreview}
                        alt="Episode thumbnail preview"
                        className="max-h-24 rounded-lg border border-neutral-700"
                        width={180}
                        height={100}
                        unoptimized
                      />
                    </div>
                  ) : editingEpisode.thumbnailUrl ? (
                    <div className="mb-3">
                      <img
                        src={editingEpisode.thumbnailUrl}
                        alt="Current episode thumbnail"
                        className="max-h-24 rounded-lg border border-neutral-700"
                      />
                    </div>
                  ) : null}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={(e) => setEditEpisodeThumbnailFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-700 file:px-3 file:py-1.5 file:text-sm file:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                    Replace video file (optional)
                  </label>
                  <input
                    type="file"
                    accept={VIDEO_TYPES.join(",")}
                    onChange={async (e) => {
                      const file = e.target.files?.[0] ?? null;
                      setEditEpisodeFile(file);
                      if (file) {
                        const dur = await getVideoDuration(file);
                        if (dur > 0) setEditEpisodeDuration(secondsToDuration(dur));
                      }
                    }}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-700 file:px-3 file:py-1.5 file:text-sm file:text-neutral-100"
                  />
                  {editEpisodeVideoProgress && (
                    <div className="mt-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                      <div className="mb-1 flex items-center justify-between">
                        <span>Uploading video file</span>
                        <span>
                          {Math.round((editEpisodeVideoProgress.uploadedBytes / editEpisodeVideoProgress.totalBytes) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded bg-neutral-800">
                        <div
                          className="h-1.5 rounded bg-cyan-400"
                          style={{
                            width: `${(editEpisodeVideoProgress.uploadedBytes / editEpisodeVideoProgress.totalBytes) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {editEpisodeVideoProcessing && (
                    <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                      Processing video on Cloudflare Stream...
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditingEpisode(null)} disabled={editEpisodeSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editEpisodeSubmitting}>
                  {editEpisodeSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
