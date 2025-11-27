// Compliance Risk
export interface ComplianceRisk {
  id?: number;
  issue?: string;
  title?: string;
  description: string;
  severity: number;
  category?: string;
  regulation: string;
  potentialFine: string;
  fix?: string;
}

// Compliance Fix
export interface ComplianceFix {
  title: string;
  description: string;
  priority: string;
  timeframe: string;
}

// Action Plan Day
export interface ActionPlanDay {
  day: number;
  title: string;
  tasks: string[];
}

// Policy Update
export interface PolicyUpdate {
  section: string;
  currentIssue: string;
  suggestedLanguage: string;
}

// Analysis Result
export interface AnalysisResult {
  summary: string;
  overallRiskScore: number;
  risks: ComplianceRisk[];
  fixes?: ComplianceFix[];
  policyUpdates: (string | PolicyUpdate)[];
  actionPlan: ActionPlanDay[] | Record<string, string>;
  positiveFindings?: string[];
  potentialFines?: string;
  analyzedAt?: string;
  documentWordCount?: number;
  aiModelsUsed?: string[];
}

// Report
export interface Report {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  analysis: AnalysisResult;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  pdfUrl?: string;
}

// Subscription
export interface Subscription {
  id: string;
  userId: string;
  tier: 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodEnd: string;
  createdAt: string;
}

// User Subscription Limits
export const TIER_LIMITS = {
  starter: {
    monthlyAnalyses: 10,
    regulations: 5,
    teamMembers: 1,
  },
  growth: {
    monthlyAnalyses: 50,
    regulations: 25,
    teamMembers: 5,
  },
  enterprise: {
    monthlyAnalyses: Infinity,
    regulations: 50,
    teamMembers: Infinity,
  },
};
