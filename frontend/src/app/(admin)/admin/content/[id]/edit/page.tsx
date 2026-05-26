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
  uploadVideoFileWithStrategy,
} from "@/lib/multipart-upload";
import type { AdminCategoryDto, ContentType } from "@/types/api";

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
    { id: string; seasonNumber: number; title: string; episodeCount: number }[]
  >([]);
  const [episodes, setEpisodes] = useState<
    {
      id: string;
      seasonId?: string;
      episodeNumber: number;
      title: string;
      duration: string;
    }[]
  >([]);

  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [published, setPublished] = useState(false);
  const [contentType, setContentType] = useState<ContentType>("MOVIE");
  const [releaseYear, setReleaseYear] = useState("");
  const [ageRating, setAgeRating] = useState("NR");

  const [seasonSelection, setSeasonSelection] = useState("new");
  const [seasonNumber, setSeasonNumber] = useState("1");
  const [seasonTitle, setSeasonTitle] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("1");
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodeDuration, setEpisodeDuration] = useState("");
  const [episodeFile, setEpisodeFile] = useState<File | null>(null);
  const [episodeThumbnailFile, setEpisodeThumbnailFile] = useState<File | null>(
    null,
  );
  const [episodeThumbnailPreview, setEpisodeThumbnailPreview] = useState<
    string | null
  >(null);
  const [episodeSubmitting, setEpisodeSubmitting] = useState(false);
  const [episodeError, setEpisodeError] = useState<string | null>(null);
  const [episodeSuccess, setEpisodeSuccess] = useState<string | null>(null);
  const [episodeVideoProgress, setEpisodeVideoProgress] = useState<{
    uploadedBytes: number;
    totalBytes: number;
  } | null>(null);
  const videoUploadStrategy = DEFAULT_VIDEO_UPLOAD_STRATEGY;

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
        setSeasons(
          item.seasons?.map((season) => ({
            id: season.id,
            seasonNumber: season.seasonNumber,
            title: season.title,
            episodeCount: season.episodeCount ?? 0,
          })) ?? [],
        );
        setEpisodes(item.episodes ?? []);
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
    try {
      await adminService.updateContent(videoId, {
        title: title.trim(),
        duration: duration.trim() || undefined,
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        type: contentType,
        releaseYear: Number(releaseYear),
        ageRating: ageRating.trim(),
      });
      await adminService.publishContent(videoId, { isPublished: published });
      router.push("/admin/content");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update content.",
      );
    } finally {
      setSaving(false);
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

      const refreshed = await adminService.getContentItem(videoId);
      if (refreshed) {
        if (refreshed.seasons) {
          setSeasons(
            refreshed.seasons.map((season) => ({
              id: season.id,
              seasonNumber: season.seasonNumber,
              title: season.title,
              episodeCount: season.episodeCount ?? 0,
            })),
          );
        }
        if (refreshed.episodes) {
          setEpisodes(refreshed.episodes);
        }
      }
      setEpisodeSuccess("Episode added successfully.");
      setEpisodeTitle("");
      setEpisodeNumber("1");
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
          Update metadata and publishing status.
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
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400"
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
            <CardFooter>
              <Button type="submit" disabled={saving || isReadOnly}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/content")}
              >
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Card>

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
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400"
                    role="alert"
                  >
                    {episodeError}
                  </p>
                )}
                {episodeSuccess && (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
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
                    onChange={(e) =>
                      setEpisodeFile(e.target.files?.[0] ?? null)
                    }
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
                <div className="flex flex-wrap items-center gap-3">
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
                                      <span className="text-xs text-neutral-500">
                                        {ep.duration}
                                      </span>
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
                          <span className="text-xs text-neutral-400">
                            {ep.duration}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
