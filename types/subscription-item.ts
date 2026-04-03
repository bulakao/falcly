export type SubscriptionFrequency = 'monthly' | 'quarterly' | 'annual';

export interface SubscriptionItem {
  id: string;
  cardId: string;
  name: string;
  amount: number;
  billingDay: number; // 1-31
  frequency: SubscriptionFrequency;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
