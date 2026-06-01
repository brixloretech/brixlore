// AdConfig types — mirrors frontend/src/types/api/ad-config.types.ts exactly.

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
  midRollTimestamps: string[]; // HH:MM:SS
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

  // Failure handling
  adFailureBehavior: AdFailureBehavior;
  adLoadTimeoutSeconds: number;

  // Geo restriction
  geoRestrictionsEnabled: boolean;
  geoBlockedCountries: string[];

  // Age restriction
  ageRestrictionEnabled: boolean;
  minAge: number;

  updatedAt?: string;
}
