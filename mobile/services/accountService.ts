import { api } from "./api";

export type UserProfileDto = {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  bio?: string | null;
  createdAt: string;
};

export type UpdateUserProfileRequestDto = {
  name?: string;
  phone?: string;
  bio?: string;
};

export type UserPreferencesDto = {
  playbackQuality: "Auto" | "Low" | "Medium" | "High";
  autoplayNext: boolean;
  skipRecaps: boolean;
  subtitlesDefault: boolean;
  notifyNewReleases: boolean;
  notifyAccountAlerts: boolean;
  notifyProductTips: boolean;
  twoFactorEnabled: boolean;
};

export type UpdatePreferencesDto = Partial<UserPreferencesDto>;

export type ExportAccountDataResponseDto = {
  user: UserProfileDto;
  preferences: UserPreferencesDto;
  devices: Array<{
    id: string;
    deviceIdentifier: string;
    platform: string;
    lastActiveAt?: string | null;
    createdAt?: string;
  }>;
  subscriptions: Array<{
    planId: string;
    status: string;
    startDate?: string | null;
    endDate?: string | null;
  }>;
};

class AccountService {
  async getProfile(): Promise<UserProfileDto> {
    const response = await api.get<UserProfileDto>("/users/profile");
    return response.data;
  }

  async updateProfile(
    dto: UpdateUserProfileRequestDto,
  ): Promise<UserProfileDto> {
    const response = await api.patch<UserProfileDto>("/users/profile", dto);
    return response.data;
  }

  async getPreferences(): Promise<UserPreferencesDto> {
    const response = await api.get<UserPreferencesDto>("/users/preferences");
    return response.data;
  }

  async updatePreferences(
    dto: UpdatePreferencesDto,
  ): Promise<UserPreferencesDto> {
    const response = await api.patch<UserPreferencesDto>(
      "/users/preferences",
      dto,
    );
    return response.data;
  }

  async exportAccountData(): Promise<ExportAccountDataResponseDto> {
    const response =
      await api.get<ExportAccountDataResponseDto>("/users/export");
    return response.data;
  }

  async deleteAccount(): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>("/users/me");
    return response.data;
  }
}

export const accountService = new AccountService();
