// Tipos para sistema de billing

export type PlanType = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'RESELLER';

export interface Plan {
  id: PlanType;
  name: string;
  description: string;
  price: number; // em centavos (R$ em centavos)
  queryQuota: number;
  features: string[];
  addOns?: string[];
  stripePriceId: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: PlanType;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: Date;
  queryQuota: number;
  queriesUsedThisMonth: number;
  monthlyPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  tenantId: string;
  stripeInvoiceId: string;
  amount: number; // em centavos
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  pdfUrl: string;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
}

export interface UsageStats {
  tenantId: string;
  month: string; // YYYY-MM
  queriesExecuted: number;
  queriesFailed: number;
  uniqueCompanies: number;
  topCompanies: Array<{
    cnpj: string;
    razaoSocial: string;
    count: number;
  }>;
  estimatedOverageCharges: number;
  createdAt: Date;
}

export interface DashboardMetrics {
  usage: {
    thisMonth: number;
    limit: number;
    percentage: number;
    dailyChart: Array<{
      date: string;
      queries: number;
    }>;
  };
  remaining: number;
  daysUntilRenewal: number;
  estimatedOverage: number;
  subscription: Subscription;
  canUpgrade: boolean;
  trend: 'up' | 'down' | 'stable';
}

export interface PaymentMethod {
  id: string;
  tenantId: string;
  stripePaymentMethodId: string;
  type: 'card' | 'pix' | 'boleto';
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}
