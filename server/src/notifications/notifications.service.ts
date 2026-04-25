import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import type { SendPushNotificationDto } from './dto/send-push-notification.dto';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string | string[];
  title?: string;
  body?: string;
  data?: any;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: any;
}

interface ExpoPushResponse {
  data: ExpoPushTicket[];
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send push notification to a specific user (all their devices with push tokens)
   */
  async sendToUser(userId: string, notification: SendPushNotificationDto): Promise<void> {
    const devices = await this.prisma.device.findMany({
      where: {
        userId,
        pushToken: { not: null },
      },
      select: { pushToken: true },
    });

    if (devices.length === 0) {
      this.logger.warn(`⚠️ No devices with push tokens found for user ${userId}`);
      return;
    }

    this.logger.log(`📱 Sending to ${devices.length} device(s) for user ${userId}`);
    const pushTokens = devices.map((d) => d.pushToken).filter(Boolean) as string[];
    await this.sendPushNotifications(pushTokens, notification);
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(userIds: string[], notification: SendPushNotificationDto): Promise<void> {
    const devices = await this.prisma.device.findMany({
      where: {
        userId: { in: userIds },
        pushToken: { not: null },
      },
      select: { pushToken: true },
    });

    if (devices.length === 0) {
      this.logger.warn(`⚠️ No devices with push tokens found for ${userIds.length} users`);
      this.logger.log('💡 Tip: Users need to open the app on a physical device to register');
      return;
    }

    this.logger.log(`📱 Found ${devices.length} devices for ${userIds.length} users`);
    const pushTokens = devices.map((d) => d.pushToken).filter(Boolean) as string[];
    await this.sendPushNotifications(pushTokens, notification);
  }

  /**
   * Send push notification to all users with active subscriptions
   */
  async sendToAllSubscribedUsers(notification: SendPushNotificationDto): Promise<void> {
    const now = new Date();
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: now },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const userIds = activeSubscriptions.map((s) => s.userId);
    if (userIds.length === 0) {
      this.logger.warn('⚠️ No active subscriptions found - no notifications sent');
      this.logger.log('💡 Tip: Users need active subscriptions to receive notifications');
      return;
    }

    this.logger.log(`📢 Sending notification to ${userIds.length} subscribed users`);
    await this.sendToUsers(userIds, notification);
  }

  /**
   * Send push notification to ALL users with registered devices (regardless of subscription)
   * Use this for important announcements or in development
   */
  async sendToAllUsers(notification: SendPushNotificationDto): Promise<void> {
    const devices = await this.prisma.device.findMany({
      where: {
        pushToken: { not: null },
      },
      select: { userId: true, pushToken: true },
    });

    if (devices.length === 0) {
      this.logger.warn('⚠️ No devices with push tokens found');
      return;
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(devices.map((d) => d.userId))];
    this.logger.log(
      `📢 Sending notification to ALL ${uniqueUserIds.length} users (${devices.length} devices)`,
    );

    await this.sendToUsers(uniqueUserIds, notification);
  }

  /**
   * Send push notification via Expo Push API
   */
  private async sendPushNotifications(
    pushTokens: string[],
    notification: SendPushNotificationDto,
  ): Promise<void> {
    if (pushTokens.length === 0) {
      return;
    }

    // Filter valid Expo push tokens (start with ExponentPushToken[...)
    const validTokens = pushTokens.filter(
      (token) => token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['),
    );

    if (validTokens.length === 0) {
      this.logger.warn('No valid Expo push tokens found');
      return;
    }

    // Build Expo push message
    const message: ExpoPushMessage = {
      to: validTokens,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      sound: 'default',
      channelId: 'app-notifications', // Separate channel from media controls
      priority: 'high',
    };

    if (notification.badge) {
      message.badge = parseInt(notification.badge);
    }

    try {
      this.logger.log(`Sending push notification to ${validTokens.length} devices`);

      const response = await axios.post<ExpoPushResponse>(EXPO_PUSH_URL, message, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
      });

      // Check for errors in response
      const tickets = response.data.data;
      const errors = tickets.filter((ticket) => ticket.status === 'error');

      if (errors.length > 0) {
        this.logger.error(`Push notification errors:`, errors);
      } else {
        this.logger.log(`Successfully sent ${tickets.length} push notifications`);
      }
    } catch (error: any) {
      this.logger.error('Failed to send push notifications:', error.message);
      throw new HttpException(
        'Failed to send push notifications',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
