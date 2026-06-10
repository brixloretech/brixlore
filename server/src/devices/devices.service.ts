import { NotFoundException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Platform } from '@prisma/client';
import type { Device, User } from '@prisma/client';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the user's active subscription with plan (for device limit).
   * Returns null if no active subscription.
   */
  async getActiveSubscriptionWithPlan(userId: string) {
    const now = new Date();
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: now },
      },
      include: { plan: true },
      orderBy: { endDate: 'desc' },
    });
  }

  /**
   * Get device limit for user (from active subscription plan). Returns 0 if no active subscription.
   */
  async getDeviceLimitForUser(userId: string): Promise<number> {
    const subscription = await this.getActiveSubscriptionWithPlan(userId);
    if (!subscription?.plan) return 1; // Free account plan: 1 device limit
    return subscription.plan.deviceLimit;
  }

  /**
   * Register a device for the user. Enforces plan device limit on EVERY call —
   * including when the same device re-registers (app restart, push token refresh, etc.).
   *
   * Flow:
   * 1. Get the device limit for this user's plan.
   * 2. Evict any OTHER devices that exceed the limit (oldest-first), keeping THIS device.
   * 3. Upsert this device (update if exists, create if new).
   *
   * This ensures that even when a device "checks in" silently on app open, competing
   * sessions on other devices are immediately evicted.
   */
  async registerDevice(
    userId: string,
    platform: Platform,
    deviceIdentifier: string,
    pushToken?: string,
  ): Promise<Device> {
    const deviceLimit = await this.getDeviceLimitForUser(userId);

    if (deviceLimit > 0) {
      // Count all OTHER devices (not this one) — this device is always allowed.
      const otherDevices = await this.prisma.device.findMany({
        where: { userId, deviceIdentifier: { not: deviceIdentifier } },
        orderBy: { lastActiveAt: 'asc' }, // oldest first
      });

      // How many other devices are we allowed beyond this one?
      // allowedOthers = limit - 1 (because this device takes 1 slot)
      const allowedOthers = deviceLimit - 1;

      if (otherDevices.length > allowedOthers) {
        const excessCount = otherDevices.length - allowedOthers;
        const toEvict = otherDevices.slice(0, excessCount); // take oldest
        const toEvictIds = toEvict.map((d) => d.id);
        await this.prisma.device.deleteMany({
          where: { id: { in: toEvictIds } },
        });
        console.log(
          `🧹 Evicted ${toEvictIds.length} competing device(s) for user ${userId} ` +
          `(plan limit: ${deviceLimit}, current device: ${platform} - ${deviceIdentifier})`,
        );
      }
    }

    // Upsert the current device
    const existing = await this.prisma.device.findUnique({
      where: { userId_deviceIdentifier: { userId, deviceIdentifier } },
    });

    if (existing) {
      console.log(`📱 Device refreshed: ${platform} - ${deviceIdentifier}`);
      return this.prisma.device.update({
        where: { id: existing.id },
        data: {
          lastActiveAt: new Date(),
          platform,
          pushToken: pushToken ?? existing.pushToken,
        },
      });
    }

    console.log(`📱 Device registered (new): ${platform} - ${deviceIdentifier}`);
    return this.prisma.device.create({
      data: { userId, platform, deviceIdentifier, pushToken },
    });
  }


  /**
   * List all devices for the authenticated user.
   */
  async listDevices(userId: string): Promise<Device[]> {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  /**
   * Remove a device by DB ID. User can only remove their own device.
   */
  async removeDevice(userId: string, deviceId: string): Promise<Device> {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, userId },
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    await this.prisma.device.delete({ where: { id: deviceId } });
    return device;
  }

  /**
   * Remove a device by its deviceIdentifier string. Used on logout to cleanly
   * deregister the current device without needing the DB row ID.
   * Silently succeeds if device is not found (idempotent).
   */
  async removeDeviceByIdentifier(userId: string, deviceIdentifier: string): Promise<void> {
    await this.prisma.device.deleteMany({
      where: { userId, deviceIdentifier },
    });
    console.log(`🔓 Device deregistered on logout: ${deviceIdentifier} for user ${userId}`);
  }
}
