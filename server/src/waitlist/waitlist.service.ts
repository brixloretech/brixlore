import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateWaitlistEntryDto } from './dto/create-waitlist-entry.dto';

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWaitlistEntryDto): Promise<{ message: string }> {
    const email = dto.email.trim().toLowerCase();
    await (this.prisma as any).waitlistEntry.upsert({
      where: { email },
      create: {
        name: dto.name.trim(),
        email,
        phone: dto.phone.trim(),
        smsConsent: dto.smsConsent,
      },
      update: {
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        smsConsent: dto.smsConsent,
      },
    });
    return { message: 'You are on the list.' };
  }
}
