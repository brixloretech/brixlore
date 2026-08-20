import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';
import { BrevoWaitlistService } from './brevo-waitlist.service';

@Module({
  imports: [PrismaModule],
  controllers: [WaitlistController],
  providers: [WaitlistService, BrevoWaitlistService],
  exports: [WaitlistService],
})
export class WaitlistModule {}
