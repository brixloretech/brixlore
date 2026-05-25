// ─── Ad Config Types ─────────────────────────────────────────────────────────
// These mirror the AdConfigResponseDto returned by GET /ad-config and
// GET /ad-config/admin on the NestJS backend.

export type AdTriggerMode = 'INTERVAL' | 'FIXED_TIMESTAMPS';
export type AdFailureBehavior = 'SKIP_IMMEDIATELY' | 'RETRY_ONCE';

export interface AdConfigDto {
  id: string;
  adsEnabled: boolean;

  // Pre-roll
  preRollEnabled: boolean;
  preRollTagUrl: string;
  preRollSkippable: boolean;
  preRollSkipAfterSeconds: number;

  // Mid-roll
  midRollEnabled: boolean;
  midRollTagUrl: string;
  midRollTriggerMode: AdTriggerMode;
  midRollIntervalMinutes: number;
  midRollTimestamps: string[]; // HH:MM:SS strings
  midRollSkippable: boolean;
  midRollSkipAfterSeconds: number;
  midRollMaxPerVideo: number;

  // Post-roll
  postRollEnabled: boolean;
  postRollTagUrl: string;
  postRollSkippable: boolean;
  postRollSkipAfterSeconds: number;

  // Outstream / Banner
  outstreamEnabled: boolean;
  outstreamTagUrl: string;
  bannerEnabled: boolean;
  bannerTagUrl: string;

  // Failure behaviour
  adFailureBehavior: AdFailureBehavior;
  adLoadTimeoutSeconds: number;

  // Geo restrictions
  geoRestrictionsEnabled: boolean;
  geoBlockedCountries: string[]; // ISO-3166-1-alpha-2 codes

  // Age restriction
  ageRestrictionEnabled: boolean;
  minAge: number;

  updatedAt?: string;
}

/** Partial update shape sent from the admin panel to PATCH /ad-config/admin. */
export type UpdateAdConfigDto = Partial<Omit<AdConfigDto, 'id' | 'updatedAt'>>;
