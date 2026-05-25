import { adminService } from "@/lib/services";

export type VideoUploadStrategy = "cloudflare-stream";

export const DEFAULT_VIDEO_UPLOAD_STRATEGY: VideoUploadStrategy =
  "cloudflare-stream";

type UploadWithStrategyParams = {
  file: File;
  strategy: VideoUploadStrategy;
  onProgress?: (uploadedBytes: number, totalBytes: number) => void;
};

type UploadedVideoAsset = {
  key: string;
  uploadId: string;
  cloudflareStream: boolean;
};

export async function uploadVideoFileWithStrategy({
  file,
  strategy,
  onProgress,
}: UploadWithStrategyParams): Promise<UploadedVideoAsset> {
  if (strategy !== "cloudflare-stream") {
    throw new Error("Only Cloudflare Stream direct upload is supported for videos");
  }

  onProgress?.(0, file.size);
  const directUpload = await adminService.createCloudflareDirectUpload();
  const response = await fetch(directUpload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Cloudflare Stream upload failed");
  }

  onProgress?.(file.size, file.size);
  return {
    key: directUpload.uid,
    uploadId: directUpload.uid,
    cloudflareStream: true,
  };
}
