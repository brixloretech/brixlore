import { Body, Controller, Post, Param, ForbiddenException } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { SendPushNotificationDto } from './dto/send-push-notification.dto';

function ensureAdmin(user: User): void {
  const allowed = new Set(['admin', 'SUPER_ADMIN', 'CONTENT_MANAGER', 'CUSTOMER_SUPPORT']);
  if (!allowed.has(user.role)) {
    throw new ForbiddenException('Admin access required');
  }
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Admin endpoint: Send notification to a specific user
   */
  @Post('send/:userId')
  async sendToUser(
    @CurrentUser() user: User,
    @Param('userId') userId: string,
    @Body() dto: SendPushNotificationDto,
  ) {
    ensureAdmin(user);
    await this.notificationsService.sendToUser(userId, dto);
    return { success: true, message: 'Notification sent' };
  }

  /**
   * Admin endpoint: Send notification to ALL users (including free users)
   */
  @Post('send/all')
  async sendToAll(@CurrentUser() user: User, @Body() dto: SendPushNotificationDto) {
    ensureAdmin(user);
    await this.notificationsService.sendToAllUsers(dto);
    return { success: true, message: 'Notifications sent to all registered users' };
  }

  /**
   * Admin endpoint: Send notification to subscribed users only
   */
  @Post('send/subscribers')
  async sendToSubscribers(@CurrentUser() user: User, @Body() dto: SendPushNotificationDto) {
    ensureAdmin(user);
    await this.notificationsService.sendToAllSubscribedUsers(dto);
    return { success: true, message: 'Notifications sent to subscribed users' };
  }

  /**
   * Admin endpoint: Send notification to ALL users (regardless of subscription)
   * Use for important announcements or testing
   */
  @Post('send/all-users')
  async sendToAllUsers(@CurrentUser() user: User, @Body() dto: SendPushNotificationDto) {
    ensureAdmin(user);
    await this.notificationsService.sendToAllUsers(dto);
    return { success: true, message: 'Notifications sent to all registered users' };
  }

  /**
   * Test endpoint: Send notification to current user (for testing)
   */
  @Post('test')
  async testNotification(@CurrentUser() user: User) {
    await this.notificationsService.sendToUser(user.id, {
      title: 'Test Notification',
      body: 'This is a test notification from Brixlore',
      data: { type: 'test' },
      type: 'info',
    });
    return { success: true, message: 'Test notification sent' };
  }
}
