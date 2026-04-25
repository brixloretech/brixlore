"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { adminService } from "@/lib/services";
import { parseBranding } from "@/lib/branding";
import { ApiError } from "@/lib/api-client";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Loader,
} from "@/components/ui";

const BANNER_VIDEO_ACCEPT = "video/mp4,video/webm";

export default function AdminBrandingPage() {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerVideoUrl, setBannerVideoUrl] = useState("");
  const [mobileWelcomeVideoUrl, setMobileWelcomeVideoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerVideoFile, setBannerVideoFile] = useState<File | null>(null);
  const [mobileWelcomeVideoFile, setMobileWelcomeVideoFile] =
    useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerVideoPreview, setBannerVideoPreview] = useState<string | null>(
    null,
  );
  const [mobileWelcomeVideoPreview, setMobileWelcomeVideoPreview] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    adminService
      .getSitePage("branding")
      .then((page) => {
        if (!active) return;
        const branding = parseBranding(page?.content ?? "");
        setLogoUrl(branding.logoUrl ?? "");
        setBannerUrl(branding.bannerUrl ?? "");
        setBannerVideoUrl(branding.bannerVideoUrl ?? "");
        setMobileWelcomeVideoUrl(branding.mobileWelcomeVideoUrl ?? "");
        setLogoPreview(branding.logoUrl ?? null);
        setBannerPreview(branding.bannerUrl ?? null);
        setBannerVideoPreview(branding.bannerVideoUrl ?? null);
        setMobileWelcomeVideoPreview(branding.mobileWelcomeVideoUrl ?? null);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) {
          setLogoUrl("");
          setBannerUrl("");
          setBannerVideoUrl("");
          setMobileWelcomeVideoUrl("");
          setLogoPreview(null);
          setBannerPreview(null);
          setBannerVideoPreview(null);
          setMobileWelcomeVideoPreview(null);
          setError(null);
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to load branding.",
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const canPreviewLogo = useMemo(
    () => (logoPreview ?? logoUrl).trim().length > 0,
    [logoPreview, logoUrl],
  );
  const canPreviewBanner = useMemo(
    () => (bannerPreview ?? bannerUrl).trim().length > 0,
    [bannerPreview, bannerUrl],
  );
  const canPreviewBannerVideo = useMemo(
    () =>
      (bannerVideoPreview ?? bannerVideoUrl).trim().length > 0 ||
      bannerVideoFile !== null,
    [bannerVideoPreview, bannerVideoUrl, bannerVideoFile],
  );
  const canPreviewMobileWelcomeVideo = useMemo(
    () =>
      (mobileWelcomeVideoPreview ?? mobileWelcomeVideoUrl).trim().length > 0 ||
      mobileWelcomeVideoFile !== null,
    [mobileWelcomeVideoPreview, mobileWelcomeVideoUrl, mobileWelcomeVideoFile],
  );

  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!bannerFile) return;
    const url = URL.createObjectURL(bannerFile);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

  useEffect(() => {
    if (!bannerVideoFile) return;
    const url = URL.createObjectURL(bannerVideoFile);
    setBannerVideoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerVideoFile]);

  useEffect(() => {
    if (!mobileWelcomeVideoFile) return;
    const url = URL.createObjectURL(mobileWelcomeVideoFile);
    setMobileWelcomeVideoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [mobileWelcomeVideoFile]);

  async function uploadAsset(
    file: File,
    kind: "video" | "thumbnail",
  ): Promise<string> {
    const presign = await adminService.presignUpload({
      kind,
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    });
    await fetch(presign.url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    }).then(async (res) => {
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Upload failed");
      }
    });
    return presign.publicUrl || presign.key;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      let nextLogoUrl = logoUrl.trim();
      let nextBannerUrl = bannerUrl.trim();
      let nextBannerVideoUrl = bannerVideoUrl.trim();
      let nextMobileWelcomeVideoUrl = mobileWelcomeVideoUrl.trim();

      if (logoFile) {
        nextLogoUrl = await uploadAsset(logoFile, "thumbnail");
      }
      if (bannerFile) {
        nextBannerUrl = await uploadAsset(bannerFile, "thumbnail");
      }
      if (bannerVideoFile) {
        nextBannerVideoUrl = await uploadAsset(bannerVideoFile, "video");
      }
      if (mobileWelcomeVideoFile) {
        nextMobileWelcomeVideoUrl = await uploadAsset(
          mobileWelcomeVideoFile,
          "video",
        );
      }

      const content = JSON.stringify({
        logoUrl: nextLogoUrl || undefined,
        bannerUrl: nextBannerUrl || undefined,
        bannerVideoUrl: nextBannerVideoUrl || undefined,
        mobileWelcomeVideoUrl: nextMobileWelcomeVideoUrl || undefined,
      });
      await adminService.updateSitePage("branding", {
        title: "Branding",
        content,
      });
      setLogoUrl(nextLogoUrl);
      setBannerUrl(nextBannerUrl);
      setBannerVideoUrl(nextBannerVideoUrl);
      setMobileWelcomeVideoUrl(nextMobileWelcomeVideoUrl);
      setLogoFile(null);
      setBannerFile(null);
      setBannerVideoFile(null);
      setMobileWelcomeVideoFile(null);
      setBannerVideoPreview(nextBannerVideoUrl || null);
      setMobileWelcomeVideoPreview(nextMobileWelcomeVideoUrl || null);
      setSuccess("Branding updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save branding.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-neutral-700/50 bg-neutral-900/50 py-12">
        <Loader size="lg" label="Loading branding…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Branding
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Set the logo and hero banner (image or video) for the landing page.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/settings")}
        >
          Back to settings
        </Button>
      </header>

      <Card className="max-w-3xl">
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle>Brand assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p
                className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-300"
                role="alert"
              >
                {error}
              </p>
            )}
            {success && (
              <p
                className="rounded-lg bg-emerald-950/50 px-3 py-2 text-sm text-emerald-200"
                role="status"
              >
                {success}
              </p>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Logo file
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-200 file:px-3 file:py-1.5 file:text-sm file:text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:file:bg-neutral-700 dark:file:text-neutral-100"
              />
            </div>
            {canPreviewLogo ? (
              <div className="rounded-lg border border-neutral-700/60 bg-neutral-900/60 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Logo preview
                </p>
                <Image
                  src={logoPreview ?? logoUrl}
                  alt="Logo preview"
                  width={160}
                  height={48}
                  className="mt-3 h-12 w-auto object-contain"
                  unoptimized
                />
              </div>
            ) : null}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Landing page banner image
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-200 file:px-3 file:py-1.5 file:text-sm file:text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:file:bg-neutral-700 dark:file:text-neutral-100"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Optional. Used as fallback or background when no banner video is
                set.
              </p>
            </div>
            {canPreviewBanner ? (
              <div className="rounded-lg border border-neutral-700/60 bg-neutral-900/60 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Banner image preview
                </p>
                <Image
                  src={bannerPreview ?? bannerUrl}
                  alt="Banner preview"
                  width={1200}
                  height={400}
                  className="mt-3 h-28 w-full rounded-md object-cover"
                  unoptimized
                />
              </div>
            ) : null}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Landing page banner video
              </label>
              <input
                type="file"
                accept={BANNER_VIDEO_ACCEPT}
                onChange={(e) =>
                  setBannerVideoFile(e.target.files?.[0] ?? null)
                }
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-200 file:px-3 file:py-1.5 file:text-sm file:text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:file:bg-neutral-700 dark:file:text-neutral-100"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Optional. MP4 or WebM. When set, this video is shown as the hero
                banner on the landing page (autoplay, muted, loop).
              </p>
            </div>
            {canPreviewBannerVideo ? (
              <div className="rounded-lg border border-neutral-700/60 bg-neutral-900/60 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Banner video preview
                </p>
                <video
                  src={bannerVideoPreview ?? bannerVideoUrl}
                  controls
                  muted
                  loop
                  playsInline
                  className="mt-3 h-40 w-full rounded-md object-cover"
                />
              </div>
            ) : null}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Mobile welcome screen video
              </label>
              <input
                type="file"
                accept={BANNER_VIDEO_ACCEPT}
                onChange={(e) =>
                  setMobileWelcomeVideoFile(e.target.files?.[0] ?? null)
                }
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-200 file:px-3 file:py-1.5 file:text-sm file:text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:file:bg-neutral-700 dark:file:text-neutral-100"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Optional. MP4 or WebM. When set, this video is shown as the
                background on the mobile app welcome screen (autoplay, muted,
                loop).
              </p>
            </div>
            {canPreviewMobileWelcomeVideo ? (
              <div className="rounded-lg border border-neutral-700/60 bg-neutral-900/60 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Mobile welcome video preview
                </p>
                <video
                  src={mobileWelcomeVideoPreview ?? mobileWelcomeVideoUrl}
                  controls
                  muted
                  loop
                  playsInline
                  className="mt-3 h-40 w-full rounded-md object-cover"
                />
              </div>
            ) : null}
            <p className="text-xs text-neutral-500">
              Logo: PNG, JPG, WebP, SVG. Banner: image (PNG, JPG, WebP) or video
              (MP4, WebM). Used on the landing page and across the site. Mobile
              welcome video is used in the mobile app only.
            </p>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save branding"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
