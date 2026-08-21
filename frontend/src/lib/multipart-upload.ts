import { adminService } from "@/lib/services";
import * as tus from "tus-js-client";

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



export async function waitForCloudflareStreamReady(
  uid: string,
  options?: {
    timeoutMs?: number;
    pollIntervalMs?: number;
  },
): Promise<void> {
  const trimmed = uid.trim();
  if (!trimmed) {
    throw new Error("Cloudflare Stream uid is required");
  }

  const timeoutMs = options?.timeoutMs ?? 180_000;
  const pollIntervalMs = options?.pollIntervalMs ?? 5_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const status = await adminService.getCloudflareVideoStatus(trimmed);
    if (status.readyToStream || status.status === "ready") {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(
    "Cloudflare Stream video is still processing. Please try again in a moment.",
  );
}

export async function uploadVideoFileWithStrategy({
  file,
  strategy,
  onProgress,
}: UploadWithStrategyParams): Promise<UploadedVideoAsset> {
  if (strategy !== "cloudflare-stream") {
    throw new Error("Only Cloudflare Stream direct upload is supported for videos");
  }

  onProgress?.(0, file.size);
  const directUpload = await adminService.createCloudflareDirectUpload(
    file.size,
    file.name,
  );
  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      uploadUrl: directUpload.uploadUrl,
      chunkSize: 50 * 1024 * 1024, // 50MB chunks
      retryDelays: [0, 3000, 5000, 10000, 20000],
      storeFingerprintForResuming: false,
      metadata: {
        filename: file.name,
        filetype: file.type,
      },
      onError: (error) => {
        reject(new Error(error.message || "Cloudflare Stream upload failed"));
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        onProgress?.(bytesUploaded, bytesTotal);
      },
      onSuccess: () => {
        resolve();
      },
    });

    upload.start();
  });

  onProgress?.(file.size, file.size);
  return {
    key: directUpload.uid,
    uploadId: directUpload.uid,
    cloudflareStream: true,
  };
}
