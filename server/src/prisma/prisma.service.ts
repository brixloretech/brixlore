import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Neon/NAT firewalls can drop idle TCP connections in as little as 30 s.
// Ping every 15 s — well under any NAT timeout — to keep the connection alive.
const KEEP_ALIVE_INTERVAL_MS = 15 * 1000;
const CONNECT_MAX_ATTEMPTS = 8;
const CONNECT_BASE_DELAY_MS = 1000;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private keepAliveTimer: NodeJS.Timeout | null = null;

  async onModuleInit() {
    await this.connectWithRetry('startup');
    const url = process.env.DATABASE_URL ?? '';
    const host = url
      .replace(/^[^@]+@/, '')
      .split('/')[0]
      .split('?')[0];
    console.log(`[Prisma] Connected to DB host: ${host || '(unknown)'}`);
    this.startKeepAlive();
  }

  private async connectWithRetry(reason: 'startup' | 'reconnect') {
    for (let attempt = 1; attempt <= CONNECT_MAX_ATTEMPTS; attempt += 1) {
      try {
        await this.$connect();
        return;
      } catch (err) {
        const isLast = attempt === CONNECT_MAX_ATTEMPTS;
        const delayMs = CONNECT_BASE_DELAY_MS * Math.min(attempt, 5);
        this.logger.warn(
          `[Prisma] ${reason} connect attempt ${attempt}/${CONNECT_MAX_ATTEMPTS} failed${
            isLast ? '' : `, retrying in ${delayMs}ms`
          }...`,
        );
        if (isLast) throw err;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    this.stopKeepAlive();
    await this.$disconnect();
  }

  private startKeepAlive() {
    this.keepAliveTimer = setInterval(async () => {
      try {
        await this.$queryRaw`SELECT 1`;
      } catch {
        this.logger.warn('[Prisma] Keep-alive ping failed — reconnecting...');
        try {
          await this.$disconnect();
          await this.connectWithRetry('reconnect');
          this.logger.log('[Prisma] Reconnected successfully.');
        } catch (err) {
          this.logger.error('[Prisma] Reconnect failed:', err);
        }
      }
    }, KEEP_ALIVE_INTERVAL_MS);
  }

  private stopKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }
}
