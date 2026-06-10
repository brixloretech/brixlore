import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDeviceDto {
  @IsString()
  deviceIdentifier: string;
}

export class PushTokenDto {
  @IsString()
  @IsOptional()
  pushToken?: string;
}

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  async register(@CurrentUser() user: User, @Body() dto: RegisterDeviceDto) {
    return this.devicesService.registerDevice(
      user.id,
      dto.platform,
      dto.deviceIdentifier,
      dto.pushToken,
    );
  }

  @Get()
  async list(@CurrentUser() user: User) {
    return this.devicesService.listDevices(user.id);
  }

  /**
   * Deregister the calling device on logout using deviceIdentifier.
   * Idempotent — safe to call even if device was already removed.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: User, @Body() dto: LogoutDeviceDto) {
    await this.devicesService.removeDeviceByIdentifier(user.id, dto.deviceIdentifier);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.devicesService.removeDevice(user.id, id);
  }
}
