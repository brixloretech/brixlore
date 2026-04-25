import { ContentSummaryDto } from './content-summary.dto';

export class PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class ContentListResponseDto {
  items: ContentSummaryDto[];
  meta: PaginationMetaDto;
}
