/**
 * Subscription plan definitions for the comparison page.
 */

export type BenefitItem = {
  label: string;
  value: boolean | string; // true/false or descriptive text
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  trialDays: number;
  benefits: BenefitItem[];
  featured?: boolean;
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "lore-member",
    name: "Lore Member",
    description: "Perfect for single screen viewing without ads",
    price: "4.99",
    period: "month",
    trialDays: 7,
    featured: false,
    benefits: [
      { label: "Ad-free streaming", value: true },
      { label: "Multi-device", value: "1 device" },
      { label: "Downloads", value: false },
      { label: "Simulcasts", value: false },
      { label: "Perks", value: "Basic support" },
    ],
  },
  {
    id: "brixlore-collective",
    name: "Brixlore Collective",
    description: "Great for households and sharing",
    price: "9.99",
    period: "month",
    trialDays: 14,
    featured: true,
    benefits: [
      { label: "Ad-free streaming", value: true },
      { label: "Multi-device", value: "Up to 3 devices" },
      { label: "Downloads", value: true },
      { label: "Simulcasts", value: true },
      { label: "Perks", value: "Early access & exclusive content" },
    ],
  },
  {
    id: "lorekeeper-elite",
    name: "Lorekeeper Elite",
    description: "The premium ultimate experience",
    price: "14.99",
    period: "month",
    trialDays: 14,
    featured: false,
    benefits: [
      { label: "Ad-free streaming", value: true },
      { label: "Multi-device", value: "Up to 5 devices" },
      { label: "Downloads", value: true },
      { label: "Simulcasts", value: true },
      { label: "Perks", value: "All perks, priority support & events" },
    ],
  },
];
