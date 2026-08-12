import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Neon/NAT firewalls can drop idle TCP connections in as little as 30 s.
// Ping every 15 s — well under any NAT timeout — to keep the connection alive.
const KEEP_ALIVE_INTERVAL_MS = 15 * 1000;
const CONNECT_MAX_ATTEMPTS = 8;
const CONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_REBUILD_AFTER_FAILURES = 3;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private keepAliveTimer: NodeJS.Timeout | null = null;
  private consecutiveReconnectFailures = 0;
  private rebuilding = false;

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

  /**
   * When the Prisma engine is stuck ("Engine is not yet connected"), ordinary
   * $disconnect / $connect cycles cannot recover it. Build a fresh PrismaClient
   * and copy its request-method state onto this instance. Existing call sites
   * that hold a reference to the PrismaService (injected by Nest) keep working
   * because the new engine is now in place under the same property names.
   */
  private async rebuildPrismaClient() {
    if (this.rebuilding) return;
    this.rebuilding = true;
    try {
      this.logger.warn('[Prisma] Rebuilding PrismaClient to recover engine...');
      const fresh = new PrismaClient({ log: ['warn', 'error'] });
      try {
        await fresh.$connect();
      } catch (err) {
        this.logger.error('[Prisma] Fresh client failed to connect:', err);
        throw err;
      }
      // Replace all writable own properties of `this` with the fresh client's.
      // Prisma stores its engine + per-model delegates (user, $queryRaw, …)
      // as own properties, so this is what revives them.
      for (const key of Reflect.ownKeys(fresh)) {
        if (key === 'constructor') continue;
        try {
          (this as unknown as Record<PropertyKey, unknown>)[key] = (
            fresh as unknown as Record<PropertyKey, unknown>
          )[key];
        } catch {
          /* some props are non-writable; skip */
        }
      }
      this.logger.log('[Prisma] Rebuild succeeded; engine is live again.');
    } finally {
      this.rebuilding = false;
    }
  }

  async onModuleDestroy() {
    this.stopKeepAlive();
    try {
      await this.$disconnect();
    } catch {
      /* ignore */
    }
  }

  private startKeepAlive() {
    this.keepAliveTimer = setInterval(async () => {
      try {
        await this.$queryRaw`SELECT 1`;
        this.consecutiveReconnectFailures = 0;
      } catch {
        this.logger.warn('[Prisma] Keep-alive ping failed — reconnecting...');
        this.consecutiveReconnectFailures += 1;
        try {
          await this.$disconnect();
          await this.connectWithRetry('reconnect');
          this.logger.log('[Prisma] Reconnected successfully.');
          this.consecutiveReconnectFailures = 0;
        } catch (err) {
          this.logger.error('[Prisma] Reconnect failed:', err);
          if (this.consecutiveReconnectFailures >= RECONNECT_REBUILD_AFTER_FAILURES) {
            await this.rebuildPrismaClient();
            this.consecutiveReconnectFailures = 0;
          }
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
