import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ContentService } from './content.service';
import type { ContentListResponseDto } from './dto/content-list-response.dto';
import type { ContentDetailResponseDto } from './dto/content-detail-response.dto';
import type { SeasonResponseDto } from './dto/season-response.dto';
import type { EpisodeResponseDto } from './dto/episode-response.dto';
import type { CategoriesResponseDto } from './dto/categories-response.dto';

const CONTENT_TYPES = ['MOVIE', 'DOCUMENTARY', 'SERIES', 'ANIMATION', 'TRAILER', 'SHORT'] as const;

type ContentType = (typeof CONTENT_TYPES)[number];

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Public()
  @Get()
  async getContent(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ): Promise<ContentListResponseDto> {
    const pageNum = Math.max(1, parseInt(String(page || '1'), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || '24'), 10) || 24));
    let contentType: ContentType | undefined;
    if (type) {
      const normalized = type.trim().toUpperCase();
      if (!CONTENT_TYPES.includes(normalized as ContentType)) {
        throw new BadRequestException('Invalid content type');
      }
      contentType = normalized as ContentType;
    }
    return this.contentService.getContent(pageNum, limitNum, contentType);
  }

  @Public()
  @Get('categories')
  async getCategories(): Promise<CategoriesResponseDto> {
    return this.contentService.getCategories();
  }

  @Public()
  @Get(':id')
  async getContentById(@Param('id') id: string): Promise<ContentDetailResponseDto | null> {
    return this.contentService.getContentById(id);
  }

  @Public()
  @Get(':id/seasons')
  async getSeasons(@Param('id') id: string): Promise<SeasonResponseDto[] | null> {
    return this.contentService.getSeasons(id);
  }

  @Public()
  @Get(':id/episodes')
  async getEpisodes(
    @Param('id') id: string,
    @Query('seasonId') seasonId?: string,
  ): Promise<EpisodeResponseDto[] | null> {
    return this.contentService.getEpisodes(id, seasonId);
  }
}
