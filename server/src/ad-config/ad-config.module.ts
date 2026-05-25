import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdConfigController } from './ad-config.controller';
import { AdConfigService } from './ad-config.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdConfigController],
  providers: [AdConfigService],
  exports: [AdConfigService],
})
export class AdConfigModule {}
