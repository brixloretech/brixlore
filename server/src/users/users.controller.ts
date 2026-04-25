import { Body, Controller, Delete, Get, Patch } from '@nestjs/common';
import type { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserPreferencesDto } from './dto/user-preferences.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Returns the current authenticated user (requires valid access token). */
  @Get('me')
  getMe(@CurrentUser() user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  /** Returns the user profile used by account settings. */
  @Get('profile')
  getProfile(@CurrentUser() user: User): Promise<UserProfileDto> {
    return this.usersService.getProfile(user.id);
  }

  /** Update user profile fields (name, phone, bio). */
  @Patch('profile')
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto): Promise<UserProfileDto> {
    return this.usersService.updateProfile(user.id, dto);
  }

  /** Returns the current user's preferences. */
  @Get('preferences')
  getPreferences(@CurrentUser() user: User): Promise<UserPreferencesDto> {
    return this.usersService.getPreferences(user.id);
  }

  /** Update user preferences (playback, notifications, security toggles). */
  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: User,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<UserPreferencesDto> {
    return this.usersService.updatePreferences(user.id, dto);
  }

  /** Export user data snapshot for download. */
  @Get('export')
  exportData(@CurrentUser() user: User) {
    return this.usersService.exportAccountData(user.id);
  }

  /** Delete the current account (cascades). */
  @Delete('me')
  deleteAccount(@CurrentUser() user: User) {
    return this.usersService.deleteAccount(user.id);
  }
}
