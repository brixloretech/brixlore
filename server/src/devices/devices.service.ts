import { ForbiddenException, NotFoundException, Injectable } from '@nestjs/common';
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
    if (!subscription?.plan) return 0;
    return subscription.plan.deviceLimit;
  }

  /**
   * Register a device for the user. Enforces plan device limit if user has active subscription.
   * If the same device (userId + deviceIdentifier) already exists, updates lastActiveAt and returns it.
   */
  async registerDevice(
    userId: string,
    platform: Platform,
    deviceIdentifier: string,
    pushToken?: string,
  ): Promise<Device> {
    const existing = await this.prisma.device.findUnique({
      where: {
        userId_deviceIdentifier: { userId, deviceIdentifier },
      },
    });

    if (existing) {
      console.log(`📱 Device updated: ${platform} - ${deviceIdentifier}`);
      return this.prisma.device.update({
        where: { id: existing.id },
        data: {
          lastActiveAt: new Date(),
          platform,
          pushToken: pushToken || existing.pushToken, // Update token if provided
        },
      });
    }

    const deviceLimit = await this.getDeviceLimitForUser(userId);

    // Only enforce device limit when adding a new device.
    if (deviceLimit > 0) {
      const count = await this.prisma.device.count({ where: { userId } });
      if (count >= deviceLimit) {
        throw new ForbiddenException(
          `Device limit reached (${deviceLimit}). Remove a device from your account or upgrade your plan.`,
        );
      }
    }

    console.log(`📱 Device registered: ${platform} - ${deviceIdentifier} with push token`);
    return this.prisma.device.create({
      data: {
        userId,
        platform,
        deviceIdentifier,
        pushToken,
      },
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
   * Remove a device. User can only remove their own device.
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
}
