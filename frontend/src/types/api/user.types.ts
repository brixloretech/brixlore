export type PlaybackQuality = "Auto" | "1080p" | "720p";

export interface UserProfileDto {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  bio?: string | null;
  createdAt: string;
}

export interface UpdateUserProfileRequestDto {
  name?: string;
  phone?: string;
  bio?: string;
}

export interface UserPreferencesDto {
  playbackQuality: PlaybackQuality;
  autoplayNext: boolean;
  skipRecaps: boolean;
  subtitlesDefault: boolean;
  notifyNewReleases: boolean;
  notifyAccountAlerts: boolean;
  notifyProductTips: boolean;
  twoFactorEnabled: boolean;
}

export type UpdateUserPreferencesRequestDto = Partial<UserPreferencesDto>;

export type DevicePlatform = "ANDROID" | "IOS" | "WEB";

export interface DeviceDto {
  id: string;
  platform: DevicePlatform;
  deviceIdentifier: string;
  lastActiveAt: string;
  createdAt: string;
}

export interface AccountExportDto {
  user: UserProfileDto;
  preferences: UserPreferencesDto;
  devices: DeviceDto[];
  subscriptions: Array<{
    id: string;
    planId: string;
    status: string;
    startDate: string;
    endDate: string;
    createdAt: string;
  }>;
}
