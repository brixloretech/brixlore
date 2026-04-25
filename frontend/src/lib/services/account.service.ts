import {
  type AccountExportDto,
  type DeviceDto,
  type DevicePlatform,
  type UpdateUserPreferencesRequestDto,
  type UpdateUserProfileRequestDto,
  type UserPreferencesDto,
  type UserProfileDto,
} from "@/types/api";
import { del, get, patch, post } from "@/lib/api-client";
import { getStoredAuth } from "@/lib/auth-storage";
import { USE_MOCK_API } from "./config";
import { detectPlatform, generateDeviceIdentifier } from "@/lib/device-utils";

const MOCK_PROFILE_KEY = "mockProfile";
const MOCK_PREFS_KEY = "mockPreferences";
const MOCK_DEVICES_KEY = "mockDevices";

function readMock<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeMock<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getAuthHeaders() {
  const auth = getStoredAuth();
  if (!auth?.accessToken) return null;
  return { Authorization: `Bearer ${auth.accessToken}` };
}

const defaultPreferences: UserPreferencesDto = {
  playbackQuality: "Auto",
  autoplayNext: true,
  skipRecaps: false,
  subtitlesDefault: true,
  notifyNewReleases: true,
  notifyAccountAlerts: true,
  notifyProductTips: false,
  twoFactorEnabled: false,
};

export const accountService = {
  async getProfile(): Promise<UserProfileDto> {
    if (USE_MOCK_API) {
      const session = readMock<{ email?: string; name?: string }>(
        "mockAuthUser",
        {},
      );
      const profile = readMock<UserProfileDto>(MOCK_PROFILE_KEY, {
        id: "mock-user",
        email: session.email ?? "demo@streaming.app",
        name: session.name ?? "Demo User",
        phone: "",
        bio: "",
        createdAt: new Date().toISOString(),
      });
      writeMock(MOCK_PROFILE_KEY, profile);
      return profile;
    }

    const headers = getAuthHeaders();
    if (!headers) throw new Error("Not authenticated");
    return get<UserProfileDto>("users/profile", { headers });
  },

  async updateProfile(
    body: UpdateUserProfileRequestDto,
  ): Promise<UserProfileDto> {
    if (USE_MOCK_API) {
      const current = await this.getProfile();
      const updated: UserProfileDto = {
        ...current,
        name: body.name ?? current.name,
        phone: body.phone ?? current.phone ?? "",
        bio: body.bio ?? current.bio ?? "",
      };
      writeMock(MOCK_PROFILE_KEY, updated);
      return updated;
    }

    const headers = getAuthHeaders();
    if (!headers) throw new Error("Not authenticated");
    return patch<UserProfileDto>("users/profile", body, { headers });
  },

  async getPreferences(): Promise<UserPreferencesDto> {
    if (USE_MOCK_API) {
      const prefs = readMock<UserPreferencesDto>(
        MOCK_PREFS_KEY,
        defaultPreferences,
      );
      writeMock(MOCK_PREFS_KEY, prefs);
      return prefs;
    }

    const headers = getAuthHeaders();
    if (!headers) throw new Error("Not authenticated");
    return get<UserPreferencesDto>("users/preferences", { headers });
  },

  async updatePreferences(
    body: UpdateUserPreferencesRequestDto,
  ): Promise<UserPreferencesDto> {
    if (USE_MOCK_API) {
      const current = await this.getPreferences();
      const updated = { ...current, ...body };
      writeMock(MOCK_PREFS_KEY, updated);
      return updated;
    }

    const headers = getAuthHeaders();
    if (!headers) throw new Error("Not authenticated");
    return patch<UserPreferencesDto>("users/preferences", body, { headers });
  },

  async registerDevice(): Promise<DeviceDto | null> {
    if (typeof window === "undefined") return null;
    
    const platform = detectPlatform(); // Now returns "ANDROID", "IOS", or "WEB"
    const deviceIdentifier = generateDeviceIdentifier();
    
    if (USE_MOCK_API) {
      const devices = readMock<DeviceDto[]>(MOCK_DEVICES_KEY, []);
      const existing = devices.find(
        (d) => d.deviceIdentifier === deviceIdentifier,
      );
      if (existing) {
        // Update last active
        const updated = {
          ...existing,
          lastActiveAt: new Date().toISOString(),
        };
        const updatedList = devices.map((d) =>
          d.id === existing.id ? updated : d,
        );
        writeMock(MOCK_DEVICES_KEY, updatedList);
        return updated;
      }
      const newDevice: DeviceDto = {
        id: `device-${Date.now()}`,
        platform,
        deviceIdentifier,
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      writeMock(MOCK_DEVICES_KEY, [...devices, newDevice]);
      return newDevice;
    }

    const headers = getAuthHeaders();
    if (!headers) return null;
    
    try {
      return await post<DeviceDto>(
        "devices/register",
        {
          platform: platform as DevicePlatform,
          deviceIdentifier,
        },
        { headers },
      );
    } catch {
      // Silently fail - device registration is optional
      return null;
    }
  },

  async listDevices(): Promise<DeviceDto[]> {
    if (USE_MOCK_API) {
      const devices = readMock<DeviceDto[]>(MOCK_DEVICES_KEY, []);
      writeMock(MOCK_DEVICES_KEY, devices);
      return devices;
    }

    const headers = getAuthHeaders();
    if (!headers) throw new Error("Not authenticated");
    return get<DeviceDto[]>("devices", { headers });
  },

  async removeDevice(id: string): Promise<DeviceDto> {
    if (USE_MOCK_API) {
      const devices = await this.listDevices();
      const remaining = devices.filter((device) => device.id !== id);
      const removed = devices.find((device) => device.id === id);
      writeMock(MOCK_DEVICES_KEY, remaining);
      if (!removed) throw new Error("Device not found");
      return removed;
    }

    const headers = getAuthHeaders();
    if (!headers) throw new Error("Not authenticated");
    return del<DeviceDto>(`devices/${id}`, { headers });
  },

  async exportAccountData(): Promise<AccountExportDto> {
    if (USE_MOCK_API) {
      const user = await this.getProfile();
      const preferences = await this.getPreferences();
      const devices = await this.listDevices();
      return {
        user,
        preferences,
        devices,
        subscriptions: [],
      };
    }

    const headers = getAuthHeaders();
    if (!headers) throw new Error("Not authenticated");
    return get<AccountExportDto>("users/export", { headers });
  },

  async deleteAccount(): Promise<{ message: string }> {
    if (USE_MOCK_API) {
      writeMock(MOCK_PROFILE_KEY, null);
      writeMock(MOCK_PREFS_KEY, null);
      writeMock(MOCK_DEVICES_KEY, []);
      return { message: "Account deleted." };
    }

    const headers = getAuthHeaders();
    if (!headers) throw new Error("Not authenticated");
    return del<{ message: string }>("users/me", { headers });
  },

  async revokeSessions(): Promise<{ message: string }> {
    if (USE_MOCK_API) {
      return { message: "All sessions have been reset." };
    }

    const headers = getAuthHeaders();
    if (!headers) throw new Error("Not authenticated");
    return post<{ message: string }>("auth/revoke-sessions", undefined, {
      headers,
    });
  },
};
