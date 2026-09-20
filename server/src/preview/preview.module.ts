import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StreamingModule } from '../streaming/streaming.module';
import { PreviewController } from './preview.controller';
import { PreviewService } from './preview.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, StreamingModule, AuthModule],
  controllers: [PreviewController],
  providers: [PreviewService],
})
export class PreviewModule {}
