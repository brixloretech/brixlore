import { api } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { v4 as uuidv4 } from "uuid";

export type DeviceDto = {
  id: string;
  deviceIdentifier: string;
  platform: string;
  lastActiveAt?: string | null;
  createdAt?: string | null;
};

const DEVICE_ID_KEY = "@device_id";

class DeviceService {
  private async getDeviceId(): Promise<string> {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = Device.modelName || Device.deviceName || uuidv4();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  private getPlatform(): "ANDROID" | "IOS" | "WEB" {
    if (Platform.OS === "ios") return "IOS";
    if (Platform.OS === "android") return "ANDROID";
    return "WEB";
  }

  async getDeviceIdentity(): Promise<{
    deviceIdentifier: string;
    platform: "ANDROID" | "IOS" | "WEB";
  }> {
    const deviceIdentifier = await this.getDeviceId();
    const platform = this.getPlatform();
    return { deviceIdentifier, platform };
  }

  async registerDevice(pushToken?: string): Promise<DeviceDto | null> {
    try {
      const { deviceIdentifier, platform } = await this.getDeviceIdentity();
      const response = await api.post<DeviceDto>("/devices/register", {
        platform,
        deviceIdentifier,
        pushToken,
      });
      return response.data ?? null;
    } catch {
      return null;
    }
  }
  async listDevices(): Promise<DeviceDto[]> {
    const response = await api.get<DeviceDto[]>("/devices");
    if (Array.isArray(response.data)) {
      return response.data;
    }
    const data = response.data as unknown as { devices?: DeviceDto[] };
    return Array.isArray(data?.devices) ? data.devices : [];
  }

  async removeDevice(id: string): Promise<void> {
    await api.delete(`/devices/${encodeURIComponent(id)}`);
  }
}

export const deviceService = new DeviceService();
