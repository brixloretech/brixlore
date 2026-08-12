import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CreateWaitlistEntryDto } from './dto/create-waitlist-entry.dto';
import { WaitlistService } from './waitlist.service';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateWaitlistEntryDto): Promise<{ message: string }> {
    return this.waitlistService.create(dto);
  }
}
