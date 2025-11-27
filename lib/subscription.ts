// Subscription tier management

export type SubscriptionTier = 'free' | 'starter' | 'growth' | 'pro';

export interface TierLimits {
  uploadsPerMonth: number;
  teamMembers: number;
  locations: number;
  features: string[];
  price: number;
  priceAnnual: number;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    uploadsPerMonth: 1,
    teamMembers: 1,
    locations: 1,
    features: [
      'Single document analysis',
      'Basic risk assessment',
      'PDF report download',
    ],
    price: 0,
    priceAnnual: 0,
  },
  starter: {
    uploadsPerMonth: 5,
    teamMembers: 1,
    locations: 1,
    features: [
      '5 analyses per month',
      'Full risk assessment',
      'PDF report download',
      '7-day action plans',
      'Email support',
    ],
    price: 99,
    priceAnnual: 79,
  },
  growth: {
    uploadsPerMonth: 20,
    teamMembers: 5,
    locations: 3,
    features: [
      '20 analyses per month',
      'Full risk assessment',
      'PDF report download',
      '7-day action plans',
      'Trend charts & insights',
      'Weekly compliance digest',
      'Up to 5 team members',
      'Up to 3 locations',
      'Priority support',
    ],
    price: 299,
    priceAnnual: 249,
  },
  pro: {
    uploadsPerMonth: -1, // Unlimited
    teamMembers: -1, // Unlimited
    locations: -1, // Unlimited
    features: [
      'Unlimited analyses',
      'Full risk assessment',
      'PDF report download',
      '7-day action plans',
      'Trend charts & insights',
      'Weekly compliance digest',
      'Predictive risk alerts',
      'Unlimited team members',
      'Unlimited locations',
      'Full team dashboard',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      '24/7 priority support',
    ],
    price: 799,
    priceAnnual: 649,
  },
};

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier];
}

export function canUpload(tier: SubscriptionTier, currentUploadsThisMonth: number): boolean {
  const limits = getTierLimits(tier);
  if (limits.uploadsPerMonth === -1) return true; // Unlimited
  return currentUploadsThisMonth < limits.uploadsPerMonth;
}

export function getUpgradeMessage(tier: SubscriptionTier): string | null {
  switch (tier) {
    case 'free':
      return 'Upgrade to Starter for 5 analyses/month and full features';
    case 'starter':
      return 'Upgrade to Growth for 20 analyses/month and team features';
    case 'growth':
      return 'Upgrade to Pro for unlimited analyses and premium support';
    case 'pro':
      return null;
    default:
      return null;
  }
}

export function getNextTier(tier: SubscriptionTier): SubscriptionTier | null {
  switch (tier) {
    case 'free':
      return 'starter';
    case 'starter':
      return 'growth';
    case 'growth':
      return 'pro';
    case 'pro':
      return null;
    default:
      return null;
  }
}

// Feature flags by tier
export function hasFeature(tier: SubscriptionTier, feature: string): boolean {
  const features = TIER_LIMITS[tier].features;
  return features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
}

export function canAccessTeamFeatures(tier: SubscriptionTier): boolean {
  return tier === 'growth' || tier === 'pro';
}

export function canAccessPredictiveAlerts(tier: SubscriptionTier): boolean {
  return tier === 'pro';
}

export function canAccessTrendCharts(tier: SubscriptionTier): boolean {
  return tier === 'growth' || tier === 'pro';
}

export function getLockedFeatures(tier: SubscriptionTier): string[] {
  const allProFeatures = TIER_LIMITS.pro.features;
  const currentFeatures = TIER_LIMITS[tier].features;
  
  return allProFeatures.filter(f => !currentFeatures.some(cf => cf === f));
}

