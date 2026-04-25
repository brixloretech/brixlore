import { Injectable, BadRequestException } from '@nestjs/common';
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream } from 'fs';

const DEFAULT_SIGNED_URL_EXPIRES_SEC = 60 * 60;
const DEFAULT_PRESIGN_UPLOAD_EXPIRES_SEC = 15 * 60;
const DEFAULT_MULTIPART_PART_PRESIGN_EXPIRES_SEC = 30 * 60;

type R2Config = {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
  publicBaseUrl?: string;
};

@Injectable()
export class R2Service {
  private client: S3Client | null = null;
  private config: R2Config | null = null;

  private ensureConfig(): R2Config {
    if (!this.config) {
      const endpoint = process.env.R2_ENDPOINT;
      const accessKeyId = process.env.R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      const bucket = process.env.R2_BUCKET_NAME;
      const region = process.env.R2_REGION ?? 'auto';
      const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '');

      if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
        throw new BadRequestException('R2 storage is not configured');
      }

      this.config = {
        endpoint,
        accessKeyId,
        secretAccessKey,
        bucket,
        region,
        publicBaseUrl: publicBaseUrl || undefined,
      };
    }
    return this.config;
  }

  private getClient(): S3Client {
    if (!this.client) {
      const config = this.ensureConfig();
      this.client = new S3Client({
        region: config.region,
        endpoint: config.endpoint,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
        forcePathStyle: true,
        // Avoid checksum headers in presigned PUTs (R2 returns 400 for CRC placeholders).
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      });
    }
    return this.client;
  }

  getPublicUrl(key: string): string | null {
    const config = this.ensureConfig();
    if (!config.publicBaseUrl) return null;
    const normalized = key.replace(/^\/+/, '');
    return `${config.publicBaseUrl}/${normalized}`;
  }

  getPublicBaseUrl(): string | null {
    const config = this.ensureConfig();
    return config.publicBaseUrl ?? null;
  }

  async getSignedGetUrl(
    key: string,
    expiresInSec = DEFAULT_SIGNED_URL_EXPIRES_SEC,
  ): Promise<string> {
    const config = this.ensureConfig();
    const client = this.getClient();
    const normalized = key.replace(/^\/+/, '');
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: normalized,
    });
    return getSignedUrl(client, command, { expiresIn: expiresInSec });
  }

  async getSignedPutUrl(
    key: string,
    contentType: string,
    expiresInSec = DEFAULT_PRESIGN_UPLOAD_EXPIRES_SEC,
  ): Promise<string> {
    const config = this.ensureConfig();
    const client = this.getClient();
    const normalized = key.replace(/^\/+/, '');
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: normalized,
      ContentType: contentType,
    });
    return getSignedUrl(client, command, { expiresIn: expiresInSec });
  }

  async uploadFile(key: string, filePath: string, contentType?: string): Promise<void> {
    const config = this.ensureConfig();
    const client = this.getClient();
    const normalized = key.replace(/^\/+/, '');
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: normalized,
      Body: createReadStream(filePath),
      ContentType: contentType,
    });
    await client.send(command);
  }

  async createMultipartUpload(key: string, contentType: string): Promise<string> {
    const config = this.ensureConfig();
    const client = this.getClient();
    const normalized = key.replace(/^\/+/, '');
    const command = new CreateMultipartUploadCommand({
      Bucket: config.bucket,
      Key: normalized,
      ContentType: contentType,
    });
    const response = await client.send(command);
    if (!response.UploadId) {
      throw new BadRequestException('Failed to create multipart upload session');
    }
    return response.UploadId;
  }

  async getSignedUploadPartUrl(
    key: string,
    uploadId: string,
    partNumber: number,
    expiresInSec = DEFAULT_MULTIPART_PART_PRESIGN_EXPIRES_SEC,
  ): Promise<string> {
    const config = this.ensureConfig();
    const client = this.getClient();
    const normalized = key.replace(/^\/+/, '');
    const command = new UploadPartCommand({
      Bucket: config.bucket,
      Key: normalized,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    return getSignedUrl(client, command, { expiresIn: expiresInSec });
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ partNumber: number; etag: string }>,
  ): Promise<void> {
    const config = this.ensureConfig();
    const client = this.getClient();
    const normalized = key.replace(/^\/+/, '');
    const command = new CompleteMultipartUploadCommand({
      Bucket: config.bucket,
      Key: normalized,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
          .slice()
          .sort((a, b) => a.partNumber - b.partNumber)
          .map((part) => ({
            ETag: part.etag,
            PartNumber: part.partNumber,
          })),
      },
    });
    await client.send(command);
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    const config = this.ensureConfig();
    const client = this.getClient();
    const normalized = key.replace(/^\/+/, '');
    const command = new AbortMultipartUploadCommand({
      Bucket: config.bucket,
      Key: normalized,
      UploadId: uploadId,
    });
    await client.send(command);
  }
}
