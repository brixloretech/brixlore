import { adminService } from "@/lib/services";
import type { MultipartCompletedPartDto } from "@/types/api";

const MIN_MULTIPART_PART_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_MULTIPART_PART_SIZE_BYTES = 64 * 1024 * 1024;
const MAX_PART_UPLOAD_RETRIES = 3;

export type VideoUploadStrategy = "multipart" | "legacy-single-put";

export const DEFAULT_VIDEO_UPLOAD_STRATEGY: VideoUploadStrategy =
  process.env.NEXT_PUBLIC_ADMIN_VIDEO_UPLOAD_STRATEGY === "legacy"
    ? "legacy-single-put"
    : "multipart";

export const ENABLE_LEGACY_VIDEO_UPLOAD_TOGGLE =
  process.env.NEXT_PUBLIC_ENABLE_LEGACY_VIDEO_UPLOAD_TOGGLE === "true";

type UploadKind = "video" | "thumbnail";

type MultipartUploadParams = {
  kind: UploadKind;
  file: File;
  onProgress?: (uploadedBytes: number, totalBytes: number) => void;
};

type UploadWithStrategyParams = {
  file: File;
  strategy: VideoUploadStrategy;
  onProgress?: (uploadedBytes: number, totalBytes: number) => void;
};

function getEtagFromResponse(response: Response): string | null {
  return response.headers.get("etag") ?? response.headers.get("ETag");
}

async function uploadPartWithRetry(
  url: string,
  chunk: Blob,
): Promise<Response> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_PART_UPLOAD_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "PUT",
        body: chunk,
      });
      if (response.ok) {
        return response;
      }
      lastError = new Error(await response.text());
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Multipart upload failed for one of the parts");
}

export async function uploadFileWithMultipart({
  kind,
  file,
  onProgress,
}: MultipartUploadParams): Promise<{ key: string; uploadId: string }> {
  const init = await adminService.initMultipartUpload({
    kind,
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
  });

  const partSize = Math.max(
    init.partSizeBytes || DEFAULT_MULTIPART_PART_SIZE_BYTES,
    MIN_MULTIPART_PART_SIZE_BYTES,
  );

  const completedParts: MultipartCompletedPartDto[] = [];
  let uploadedBytes = 0;

  try {
    const totalParts = Math.ceil(file.size / partSize);

    for (let index = 0; index < totalParts; index += 1) {
      const partNumber = index + 1;
      const start = index * partSize;
      const end = Math.min(start + partSize, file.size);
      const chunk = file.slice(start, end);

      const { url } = await adminService.getMultipartPartUrl({
        key: init.key,
        uploadId: init.uploadId,
        partNumber,
      });

      const uploadResponse = await uploadPartWithRetry(url, chunk);
      const etag = getEtagFromResponse(uploadResponse);
      if (!etag) {
        throw new Error(
          "Missing ETag in upload response. Update R2 CORS to expose the ETag header.",
        );
      }

      completedParts.push({ partNumber, etag });
      uploadedBytes += chunk.size;
      onProgress?.(uploadedBytes, file.size);
    }

    await adminService.completeMultipartUpload({
      key: init.key,
      uploadId: init.uploadId,
      parts: completedParts,
    });

    return { key: init.key, uploadId: init.uploadId };
  } catch (error) {
    await adminService
      .abortMultipartUpload({ key: init.key, uploadId: init.uploadId })
      .catch(() => undefined);
    throw error;
  }
}

export async function uploadFileWithSinglePut({
  kind,
  file,
  onProgress,
}: MultipartUploadParams): Promise<{ key: string; uploadId: string }> {
  onProgress?.(0, file.size);
  const presigned = await adminService.presignUpload({
    kind,
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
  });

  const response = await fetch(presigned.url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Upload failed");
  }

  onProgress?.(file.size, file.size);
  return { key: presigned.key, uploadId: presigned.uploadId };
}

export async function uploadVideoFileWithStrategy({
  file,
  strategy,
  onProgress,
}: UploadWithStrategyParams): Promise<{ key: string; uploadId: string }> {
  if (strategy === "legacy-single-put") {
    return uploadFileWithSinglePut({ kind: "video", file, onProgress });
  }

  return uploadFileWithMultipart({ kind: "video", file, onProgress });
}
