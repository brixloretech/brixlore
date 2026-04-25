import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { UserPreferencesDto } from './dto/user-preferences.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        bio: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfileDto> {
    const data = {
      name: dto.name?.trim() || null,
      phone: dto.phone?.trim() || null,
      bio: dto.bio?.trim() || null,
    };
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        bio: true,
        createdAt: true,
      },
    });
    return user;
  }

  async getPreferences(userId: string): Promise<UserPreferencesDto> {
    const prefs = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });
    if (prefs) {
      return {
        playbackQuality: prefs.playbackQuality,
        autoplayNext: prefs.autoplayNext,
        skipRecaps: prefs.skipRecaps,
        subtitlesDefault: prefs.subtitlesDefault,
        notifyNewReleases: prefs.notifyNewReleases,
        notifyAccountAlerts: prefs.notifyAccountAlerts,
        notifyProductTips: prefs.notifyProductTips,
        twoFactorEnabled: prefs.twoFactorEnabled,
      };
    }

    const created = await this.prisma.userPreferences.create({
      data: { userId },
    });
    return {
      playbackQuality: created.playbackQuality,
      autoplayNext: created.autoplayNext,
      skipRecaps: created.skipRecaps,
      subtitlesDefault: created.subtitlesDefault,
      notifyNewReleases: created.notifyNewReleases,
      notifyAccountAlerts: created.notifyAccountAlerts,
      notifyProductTips: created.notifyProductTips,
      twoFactorEnabled: created.twoFactorEnabled,
    };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<UserPreferencesDto> {
    const updated = await this.prisma.userPreferences.upsert({
      where: { userId },
      update: {
        playbackQuality: dto.playbackQuality,
        autoplayNext: dto.autoplayNext,
        skipRecaps: dto.skipRecaps,
        subtitlesDefault: dto.subtitlesDefault,
        notifyNewReleases: dto.notifyNewReleases,
        notifyAccountAlerts: dto.notifyAccountAlerts,
        notifyProductTips: dto.notifyProductTips,
        twoFactorEnabled: dto.twoFactorEnabled,
      },
      create: {
        userId,
        playbackQuality: dto.playbackQuality ?? 'Auto',
        autoplayNext: dto.autoplayNext ?? true,
        skipRecaps: dto.skipRecaps ?? false,
        subtitlesDefault: dto.subtitlesDefault ?? true,
        notifyNewReleases: dto.notifyNewReleases ?? true,
        notifyAccountAlerts: dto.notifyAccountAlerts ?? true,
        notifyProductTips: dto.notifyProductTips ?? false,
        twoFactorEnabled: dto.twoFactorEnabled ?? false,
      },
    });

    return {
      playbackQuality: updated.playbackQuality,
      autoplayNext: updated.autoplayNext,
      skipRecaps: updated.skipRecaps,
      subtitlesDefault: updated.subtitlesDefault,
      notifyNewReleases: updated.notifyNewReleases,
      notifyAccountAlerts: updated.notifyAccountAlerts,
      notifyProductTips: updated.notifyProductTips,
      twoFactorEnabled: updated.twoFactorEnabled,
    };
  }

  async exportAccountData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const preferences = await this.getPreferences(userId);
    const devices = await this.prisma.device.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
    });
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      user,
      preferences,
      devices,
      subscriptions,
    };
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Account deleted.' };
  }
}
