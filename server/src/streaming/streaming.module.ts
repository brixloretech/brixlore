import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { StreamingController } from './streaming.controller';
import { EpisodesController } from './episodes.controller';
import { StreamingService } from './streaming.service';
import { TranscodeService } from './transcode.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [StreamingController, EpisodesController],
  providers: [StreamingService, TranscodeService],
  exports: [StreamingService, TranscodeService],
})
export class StreamingModule {}
