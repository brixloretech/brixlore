export class DownloadTokenResponseDto {
  /** Time-limited signed token; use when requesting the actual download (e.g. in Authorization header or query). */
  token: string;
  /** When this token expires (use before this to start/fetch the download). */
  expiresAt: Date;
  /** When the offline download authorization expires (content must be removed by then). */
  downloadExpiresAt: Date;
}
