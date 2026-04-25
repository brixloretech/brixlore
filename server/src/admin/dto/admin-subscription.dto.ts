export class AdminSubscriptionDto {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  planId: string;
  planName: string;
  planPrice: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  stripeSubscriptionId?: string;
}

export class AdminSubscriptionsSummaryDto {
  totalCount: number;
  activeCount: number;
  cancelledCount: number;
  expiredCount: number;
  activeRevenue: string;
}

export class AdminSubscriptionsResponseDto {
  total: number;
  subscriptions: AdminSubscriptionDto[];
  summary: AdminSubscriptionsSummaryDto;
}
