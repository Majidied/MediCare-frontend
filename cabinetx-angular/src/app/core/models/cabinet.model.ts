export type SubscriptionStatus = 'active' | 'suspended' | 'trial';
export type PlanType = 'Basique' | 'Standard' | 'Premium';

export interface Cabinet {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  plan: PlanType;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate: Date;
  monthlyFee: number;
  mapPosition: { x: number; y: number };
  createdAt: Date;
}
