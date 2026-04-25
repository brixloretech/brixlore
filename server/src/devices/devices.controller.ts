import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

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

  @Delete(':id')
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.devicesService.removeDevice(user.id, id);
  }
}
