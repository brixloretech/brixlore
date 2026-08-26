import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateWaitlistEntryDto } from './dto/create-waitlist-entry.dto';
import { BrevoWaitlistService } from './brevo-waitlist.service';

@Injectable()
export class WaitlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brevoWaitlistService: BrevoWaitlistService,
  ) {}

  async create(dto: CreateWaitlistEntryDto): Promise<{ message: string }> {
    const email = dto.email.trim().toLowerCase();
    // Keep an empty value until the nullable-phone migration has been applied.
    // This lets users skip the field with databases still using the original
    // NOT NULL column, while Brevo continues to receive no SMS attribute.
    const phone = dto.phone?.trim() || '';
    const entry = {
      name: dto.name.trim(),
      email,
      phone,
      emailConsent: dto.emailConsent,
      smsConsent: dto.smsConsent,
    };

    await (this.prisma as any).waitlistEntry.upsert({
      where: { email },
      create: entry,
      update: entry,
    });

    await this.brevoWaitlistService.sync(entry);
    return { message: 'You are on the list.' };
  }
}
