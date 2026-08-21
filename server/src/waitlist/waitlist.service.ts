import { Injectable } from '@nestjs/common';
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
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
    const phone = parsePhoneNumberFromString(dto.phone.trim())!.number;
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
