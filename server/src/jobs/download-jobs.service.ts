/**
 * Background jobs for download lifecycle: expiration, revocation, and cleanup.
 * Production-safe: batched processing, configurable limits, staggered crons, error logging.
 * For multi-instance deployments, run these crons on a single scheduler node or use
 * distributed locking (e.g. Bull with one worker) to avoid duplicate work.
 */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_BATCH_SIZE = 500;
const MAX_BATCH_SIZE = 2000;
const DEFAULT_RETENTION_DAYS = 90;

@Injectable()
export class DownloadJobsService {
  private readonly logger = new Logger(DownloadJobsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getBatchSize(): number {
    const raw = process.env.DOWNLOAD_JOBS_BATCH_SIZE;
    if (raw == null || raw === '') return DEFAULT_BATCH_SIZE;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) return DEFAULT_BATCH_SIZE;
    return Math.min(n, MAX_BATCH_SIZE);
  }

  private getRetentionDays(): number {
    const raw = process.env.DOWNLOAD_JOBS_RETENTION_DAYS;
    if (raw == null || raw === '') return DEFAULT_RETENTION_DAYS;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) return DEFAULT_RETENTION_DAYS;
    return n;
  }

  /**
   * Expire offline downloads whose expiresAt has passed.
   * Updates status from AUTHORIZED or DOWNLOADED to EXPIRED.
   * Runs in batches for production scalability; staggered at top of hour.
   */
  @Cron('0 * * * *') // Every hour at :00
  async expireDownloads(): Promise<void> {
    const start = Date.now();
    const batchSize = this.getBatchSize();
    let totalExpired = 0;

    try {
      const now = new Date();

      while (true) {
        const batch = await (this.prisma as any).download.findMany({
          where: {
            status: { in: ['AUTHORIZED', 'DOWNLOADED'] },
            expiresAt: { lt: now },
          },
          select: { id: true },
          take: batchSize,
        });

        if (batch.length === 0) break;

        const ids = batch.map((d: { id: string }) => d.id);
        const result = await (this.prisma as any).download.updateMany({
          where: { id: { in: ids } },
          data: { status: 'EXPIRED' },
        });
        totalExpired += result.count;

        if (batch.length < batchSize) break;
      }

      if (totalExpired > 0) {
        this.logger.log(
          `Expired ${totalExpired} download(s) in ${Date.now() - start}ms (batch size ${batchSize})`,
        );
      }
    } catch (err) {
      this.logger.error(
        `expireDownloads failed after ${totalExpired} expired: ${err instanceof Error ? err.message : err}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }

  /**
   * Revoke downloads for users who no longer have an active subscription.
   * Updates status from AUTHORIZED or DOWNLOADED to REVOKED.
   * Runs in batches; staggered at :15 past the hour to avoid overlap with expiration.
   */
  @Cron('15 * * * *') // Every hour at :15
  async revokeDownloadsForInactiveSubscriptions(): Promise<void> {
    const start = Date.now();
    const batchSize = this.getBatchSize();
    let totalRevoked = 0;

    try {
      const now = new Date();

      const activeSubscriptionUserIds = await (this.prisma as any).subscription
        .findMany({
          where: {
            status: 'ACTIVE',
            endDate: { gte: now },
          },
          select: { userId: true },
          distinct: ['userId'],
        })
        .then((rows: { userId: string }[]) => rows.map((r) => r.userId));

      while (true) {
        const batch = await (this.prisma as any).download.findMany({
          where: {
            status: { in: ['AUTHORIZED', 'DOWNLOADED'] },
            userId: { notIn: activeSubscriptionUserIds },
          },
          select: { id: true },
          take: batchSize,
        });

        if (batch.length === 0) break;

        const ids = batch.map((d: { id: string }) => d.id);
        const result = await (this.prisma as any).download.updateMany({
          where: { id: { in: ids } },
          data: { status: 'REVOKED' },
        });
        totalRevoked += result.count;

        if (batch.length < batchSize) break;
      }

      if (totalRevoked > 0) {
        this.logger.log(
          `Revoked ${totalRevoked} download(s) for inactive subscriptions in ${Date.now() - start}ms (batch size ${batchSize})`,
        );
      }
    } catch (err) {
      this.logger.error(
        `revokeDownloadsForInactiveSubscriptions failed after ${totalRevoked} revoked: ${err instanceof Error ? err.message : err}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }

  /**
   * Clean up old terminal-state download records (EXPIRED, REVOKED) to keep the table scalable.
   * Deletes records that have been in a terminal state longer than retention days (based on updatedAt).
   * Runs daily at 3:00 AM; uses batched deleteMany for production safety.
   */
  @Cron('0 3 * * *') // Daily at 03:00
  async cleanupOldDownloads(): Promise<void> {
    const start = Date.now();
    const batchSize = this.getBatchSize();
    const retentionDays = this.getRetentionDays();
    let totalDeleted = 0;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    try {
      while (true) {
        const batch = await (this.prisma as any).download.findMany({
          where: {
            status: { in: ['EXPIRED', 'REVOKED'] },
            updatedAt: { lt: cutoff },
          },
          select: { id: true },
          take: batchSize,
        });

        if (batch.length === 0) break;

        const ids = batch.map((d: { id: string }) => d.id);
        await (this.prisma as any).download.deleteMany({
          where: { id: { in: ids } },
        });
        totalDeleted += batch.length;

        if (batch.length < batchSize) break;
      }

      if (totalDeleted > 0) {
        this.logger.log(
          `Cleanup: deleted ${totalDeleted} old download record(s) (status EXPIRED/REVOKED, updatedAt before ${cutoff.toISOString()}) in ${Date.now() - start}ms`,
        );
      }
    } catch (err) {
      this.logger.error(
        `cleanupOldDownloads failed after ${totalDeleted} deleted: ${err instanceof Error ? err.message : err}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw err;
    }
  }
}
