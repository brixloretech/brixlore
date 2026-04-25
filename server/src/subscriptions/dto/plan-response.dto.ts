export class PlanResponseDto {
  id: string;
  name: string;
  /** Monthly price */
  price: number;
  /** Yearly price (optional) */
  yearlyPrice?: number;
  deviceLimit: number;
  offlineAllowed: boolean;
  maxOfflineDownloads: number;
  isPopular: boolean;
  perks: string[];
  createdAt: Date;
  updatedAt: Date;

  static fromPlan(plan: {
    id: string;
    name: string;
    price: unknown;
    yearlyPrice?: unknown;
    deviceLimit: number;
    offlineAllowed: boolean;
    maxOfflineDownloads: number;
    isPopular?: boolean;
    perks?: string[];
    createdAt: Date;
    updatedAt: Date;
  }): PlanResponseDto {
    return {
      id: plan.id,
      name: plan.name,
      price: Number(plan.price),
      yearlyPrice: plan.yearlyPrice != null ? Number(plan.yearlyPrice) : undefined,
      deviceLimit: plan.deviceLimit,
      offlineAllowed: plan.offlineAllowed,
      maxOfflineDownloads: plan.maxOfflineDownloads,
      isPopular: plan.isPopular ?? false,
      perks: plan.perks ?? [],
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
