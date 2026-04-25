import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { DownloadJobsService } from './download-jobs.service';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  providers: [DownloadJobsService],
  exports: [DownloadJobsService],
})
export class JobsModule {}
