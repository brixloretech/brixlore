import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdTriggerMode = 'INTERVAL' | 'FIXED_TIMESTAMPS';
export type AdFailureBehavior = 'SKIP_IMMEDIATELY' | 'RETRY_ONCE';

/**
 * Shape returned from the service after JSON fields are parsed into proper arrays.
 * This is what the controller serialises to JSON for the client.
 */
export interface AdConfigResponseDto {
  id: string;
  adsEnabled: boolean;
  preRollEnabled: boolean;
  preRollTagUrl: string;
  preRollSkippable: boolean;
  preRollSkipAfterSeconds: number;
  midRollEnabled: boolean;
  midRollTagUrl: string;
  midRollTriggerMode: AdTriggerMode;
  midRollIntervalMinutes: number;
  midRollTimestamps: string[];
  midRollSkippable: boolean;
  midRollSkipAfterSeconds: number;
  midRollMaxPerVideo: number;
  postRollEnabled: boolean;
  postRollTagUrl: string;
  postRollSkippable: boolean;
  postRollSkipAfterSeconds: number;
  outstreamEnabled: boolean;
  outstreamTagUrl: string;
  bannerEnabled: boolean;
  bannerTagUrl: string;
  adFailureBehavior: AdFailureBehavior;
  adLoadTimeoutSeconds: number;
  geoRestrictionsEnabled: boolean;
  geoBlockedCountries: string[];
  ageRestrictionEnabled: boolean;
  minAge: number;
  updatedAt: Date;
}

/**
 * Input shape accepted by updateAdConfig().
 * Arrays are sent from the client as proper arrays; the service serialises them
 * back to JSON strings before persisting.
 */
export interface UpdateAdConfigInput {
  adsEnabled?: boolean;
  preRollEnabled?: boolean;
  preRollTagUrl?: string;
  preRollSkippable?: boolean;
  preRollSkipAfterSeconds?: number;
  midRollEnabled?: boolean;
  midRollTagUrl?: string;
  midRollTriggerMode?: AdTriggerMode;
  midRollIntervalMinutes?: number;
  midRollTimestamps?: string[];
  midRollSkippable?: boolean;
  midRollSkipAfterSeconds?: number;
  midRollMaxPerVideo?: number;
  postRollEnabled?: boolean;
  postRollTagUrl?: string;
  postRollSkippable?: boolean;
  postRollSkipAfterSeconds?: number;
  outstreamEnabled?: boolean;
  outstreamTagUrl?: string;
  bannerEnabled?: boolean;
  bannerTagUrl?: string;
  adFailureBehavior?: AdFailureBehavior;
  adLoadTimeoutSeconds?: number;
  geoRestrictionsEnabled?: boolean;
  geoBlockedCountries?: string[];
  ageRestrictionEnabled?: boolean;
  minAge?: number;
}

// ─── Roles allowed to mutate ad config ───────────────────────────────────────
const ALLOWED_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'admin', 'super_admin']);

const SINGLETON_ID = 'singleton';

@Injectable()
export class AdConfigService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Prisma doesn't know about `adConfig` yet at compile time because we haven't
   * run `prisma generate`.  The `any` cast is intentional and will be removed
   * once the developer runs the migration + generate step documented in
   * ADBUTLER_IMPLEMENTATION.md.
   */
  private get repo() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.prisma as any).adConfig;
  }

  /** Ensures the singleton row exists and returns the raw DB record. */
  private async getRawOrCreate() {
    const existing = await this.repo.findUnique({ where: { id: SINGLETON_ID } });
    if (existing) return existing;
    return this.repo.create({ data: { id: SINGLETON_ID } });
  }

  /** Parses JSON-string fields back into arrays so the API always sends arrays. */
  private parse(raw: Record<string, unknown>): AdConfigResponseDto {
    return {
      ...raw,
      midRollTimestamps: this.parseJson<string[]>(raw.midRollTimestamps as string, []),
      geoBlockedCountries: this.parseJson<string[]>(raw.geoBlockedCountries as string, []),
    } as AdConfigResponseDto;
  }

  private parseJson<T>(value: string, fallback: T): T {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Returns the full config (used by the admin panel). */
  async getAdConfig(): Promise<AdConfigResponseDto> {
    const raw = await this.getRawOrCreate();
    return this.parse(raw);
  }

  /**
   * Updates the singleton config.
   * Only ADMIN / SUPER_ADMIN roles may call this.
   */
  async updateAdConfig(
    input: UpdateAdConfigInput,
    userRole: string,
  ): Promise<AdConfigResponseDto> {
    if (!ALLOWED_ROLES.has(userRole)) {
      throw new ForbiddenException('Insufficient permissions to update ad config');
    }

    // Ensure singleton exists before updating
    await this.getRawOrCreate();

    // Serialise array fields back to JSON strings for storage
    const dbPayload: Record<string, unknown> = { ...input };
    if (Array.isArray(input.midRollTimestamps)) {
      dbPayload.midRollTimestamps = JSON.stringify(input.midRollTimestamps);
    }
    if (Array.isArray(input.geoBlockedCountries)) {
      dbPayload.geoBlockedCountries = JSON.stringify(input.geoBlockedCountries);
    }

    const updated = await this.repo.update({
      where: { id: SINGLETON_ID },
      data: dbPayload,
    });

    return this.parse(updated);
  }

  /**
   * Public-safe config for the web player.
   * Returns all fields the player needs.  Tag URLs are only included when the
   * master `adsEnabled` flag is true, so accidental exposure is impossible.
   * If userId is provided, we check for an active paid subscription to suppress ads.
   */
  async getPublicAdConfig(userId?: string): Promise<AdConfigResponseDto> {
    const config = await this.getAdConfig();

    if (userId) {
      const activeSubscription = await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          endDate: { gte: new Date() },
        },
        include: {
          plan: true,
        },
      });

      if (activeSubscription?.plan) {
        const price = Number(activeSubscription.plan.price);
        const name = activeSubscription.plan.name.toLowerCase();
        // Suppress ads only for users on a paid plan (price > 0 and plan name does not contain 'free')
        if (price > 0 && !name.includes('free')) {
          return { ...config, adsEnabled: false };
        }
      }
    }

    if (!config.adsEnabled) {
      // Return a "disabled" shell so the player has a consistent shape to work with
      return { ...config, adsEnabled: false };
    }

    return config;
  }
}
