import Stripe from 'stripe';
import { v4 as uuid } from 'uuid';
import { Database } from '../db/index.js';
import { AppError, ErrorCodes } from '../types/index.js';
import { Plan, Subscription, Invoice, DashboardMetrics } from '../types/billing.types.js';
import { addDays, addMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

export class BillingService {
  private stripe: Stripe;
  private db: Database;

  constructor(db: Database) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    this.db = db;
  }

  // Planos disponíveis
  private plans: Record<string, Plan> = {
    STARTER: {
      id: 'STARTER',
      name: 'Starter',
      description: 'Para consultores e freelancers',
      price: 9900, // R$ 99,00
      queryQuota: 500,
      features: [
        '500 consultas/mês',
        'Histórico básico',
        'Suporte por email',
      ],
      stripePriceId: process.env.STRIPE_PRICE_STARTER || 'price_starter',
    },
    PROFESSIONAL: {
      id: 'PROFESSIONAL',
      name: 'Professional',
      description: 'Para pequenas e médias empresas',
      price: 29900, // R$ 299,00
      queryQuota: 5000,
      features: [
        '5.000 consultas/mês',
        'Histórico completo',
        'Relatórios básicos',
        'Suporte prioritário',
      ],
      stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional',
    },
    ENTERPRISE: {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      description: 'Para grandes corporações',
      price: 99900, // R$ 999,00 base (custom price)
      queryQuota: 100000,
      features: [
        'Consultas ilimitadas',
        'API dedicada',
        'White-label',
        'Suporte 24/7',
        'SLA 99.9%',
        'Análise de risco avançada',
      ],
      stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
    },
    RESELLER: {
      id: 'RESELLER',
      name: 'Reseller',
      description: 'Para agências e revendedores',
      price: 199900, // R$ 1.999,00 base (custom)
      queryQuota: 500000,
      features: [
        'Consultas ilimitadas',
        'API dedicada',
        'White-label completo',
        'Portal de reseller',
        'Suporte 24/7',
      ],
      stripePriceId: process.env.STRIPE_PRICE_RESELLER || 'price_reseller',
    },
  };

  /**
   * Criar ou atualizar subscription via Stripe
   */
  async createSubscription(
    tenantId: string,
    planId: string,
    email: string,
    companyName: string
  ): Promise<{ clientSecret: string | null; subscriptionId: string }> {
    const plan = this.plans[planId];
    if (!plan) {
      throw new AppError('Plano inválido', ErrorCodes.INVALID_INPUT, 400);
    }

    try {
      // 1. Criar customer no Stripe
      const customer = await this.stripe.customers.create({
        email,
        name: companyName,
        metadata: { tenantId },
      });

      // 2. Criar subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: plan.stripePriceId }],
        payment_behavior: 'default_incomplete',
        trial_period_days: 14, // 14 dias de trial
        expand: ['latest_invoice.payment_intent'],
      });

      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent | undefined;

      // 3. Salvar no DB
      const dbSubscription: Subscription = {
        id: uuid(),
        tenantId,
        planId: planId as any,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        status: 'trialing',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        trialEndsAt: addDays(new Date(), 14),
        queryQuota: plan.queryQuota,
        queriesUsedThisMonth: 0,
        monthlyPrice: plan.price,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db.query(
        `INSERT INTO subscriptions (id, tenant_id, plan_id, stripe_customer_id, stripe_subscription_id, status, trial_ends_at, query_quota, monthly_price, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          dbSubscription.id,
          tenantId,
          planId,
          customer.id,
          subscription.id,
          'trialing',
          dbSubscription.trialEndsAt,
          plan.queryQuota,
          plan.price,
          new Date(),
        ]
      );

      return {
        clientSecret: paymentIntent?.client_secret || null,
        subscriptionId: subscription.id,
      };
    } catch (error) {
      throw new AppError(
        'Erro ao criar subscription',
        ErrorCodes.INTERNAL_ERROR,
        500,
        (error as any).message
      );
    }
  }

  /**
   * Obter detalhes da subscription
   */
  async getSubscription(tenantId: string): Promise<Subscription | null> {
    const result = await this.db.query(
      'SELECT * FROM subscriptions WHERE tenant_id = $1',
      [tenantId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      planId: row.plan_id,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      status: row.status,
      currentPeriodStart: new Date(row.current_period_start),
      currentPeriodEnd: new Date(row.current_period_end),
      cancelAtPeriodEnd: row.cancel_at_period_end,
      trialEndsAt: row.trial_ends_at ? new Date(row.trial_ends_at) : undefined,
      queryQuota: row.query_quota,
      queriesUsedThisMonth: row.queries_used_this_month,
      monthlyPrice: row.monthly_price,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Upgrade de plano
   */
  async upgradePlan(tenantId: string, newPlanId: string): Promise<Subscription> {
    const subscription = await this.getSubscription(tenantId);
    if (!subscription) {
      throw new AppError('Subscription não encontrada', ErrorCodes.NOT_FOUND, 404);
    }

    const newPlan = this.plans[newPlanId];
    if (!newPlan) {
      throw new AppError('Plano inválido', ErrorCodes.INVALID_INPUT, 400);
    }

    try {
      // Atualizar subscription no Stripe
      const stripeSubscription = await this.stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          items: [
            {
              id: (await this.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId))
                .items.data[0].id,
              price: newPlan.stripePriceId,
            },
          ],
        }
      );

      // Atualizar no DB
      await this.db.query(
        `UPDATE subscriptions SET plan_id = $1, query_quota = $2, monthly_price = $3, updated_at = NOW()
         WHERE tenant_id = $4`,
        [newPlanId, newPlan.queryQuota, newPlan.price, tenantId]
      );

      // Registrar evento
      await this.db.query(
        `INSERT INTO audit_logs (id, tenant_id, action, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [uuid(), tenantId, 'PLAN_UPGRADE', JSON.stringify({ from: subscription.planId, to: newPlanId })]
      );

      return await this.getSubscription(tenantId);
    } catch (error) {
      throw new AppError(
        'Erro ao fazer upgrade',
        ErrorCodes.INTERNAL_ERROR,
        500,
        (error as any).message
      );
    }
  }

  /**
   * Obter uso de queries no mês
   */
  async getMonthlyUsage(tenantId: string): Promise<number> {
    const now = new Date();
    const monthStart = startOfMonth(now);

    const result = await this.db.query(
      `SELECT COUNT(*) as count FROM query_history
       WHERE tenant_id = $1 AND created_at >= $2`,
      [tenantId, monthStart]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Obter métricas do dashboard
   */
  async getDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
    const subscription = await this.getSubscription(tenantId);
    if (!subscription) {
      throw new AppError('Subscription não encontrada', ErrorCodes.NOT_FOUND, 404);
    }

    const monthlyUsage = await this.getMonthlyUsage(tenantId);
    const daysUntilRenewal = differenceInDays(subscription.currentPeriodEnd, new Date());
    const estimatedOverage = Math.max(0, monthlyUsage - subscription.queryQuota) * 0.25; // R$ 0.25 por query extra
    const percentage = (monthlyUsage / subscription.queryQuota) * 100;

    // Gráfico diário
    const dailyChart = await this.getDailyUsageChart(tenantId);

    return {
      usage: {
        thisMonth: monthlyUsage,
        limit: subscription.queryQuota,
        percentage,
        dailyChart,
      },
      remaining: Math.max(0, subscription.queryQuota - monthlyUsage),
      daysUntilRenewal,
      estimatedOverage,
      subscription,
      canUpgrade: monthlyUsage > subscription.queryQuota * 0.8,
      trend: percentage > 80 ? 'up' : percentage > 50 ? 'stable' : 'down',
    };
  }

  /**
   * Obter gráfico de uso diário
   */
  private async getDailyUsageChart(
    tenantId: string
  ): Promise<Array<{ date: string; queries: number }>> {
    const monthStart = startOfMonth(new Date());

    const result = await this.db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM query_history
       WHERE tenant_id = $1 AND created_at >= $2
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [tenantId, monthStart]
    );

    return result.rows.map((row: any) => ({
      date: row.date,
      queries: parseInt(row.count, 10),
    }));
  }

  /**
   * Verificar limite de queries (middleware)
   */
  async checkQueryLimit(tenantId: string): Promise<boolean> {
    const subscription = await this.getSubscription(tenantId);
    if (!subscription) return false;

    const used = await this.getMonthlyUsage(tenantId);
    return used < subscription.queryQuota;
  }

  /**
   * Registrar uso de query
   */
  async recordQuery(tenantId: string, cnpj: string, razaoSocial: string, success: boolean) {
    if (!success) return; // Não contar queries falhadas

    await this.db.query(
      `INSERT INTO query_history (id, tenant_id, cnpj, razao_social, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [uuid(), tenantId, cnpj, razaoSocial]
    );
  }

  /**
   * Listar planos disponíveis
   */
  getPlans(): Record<string, Plan> {
    return this.plans;
  }

  /**
   * Processar webhook de Stripe
   */
  async processStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(
          event.data.object as Stripe.Subscription
        );
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const tenantId = (invoice.customer as any)?.metadata?.tenantId;
    if (!tenantId) return;

    // Reset quota para novo mês
    await this.db.query(
      `UPDATE subscriptions SET queries_used_this_month = 0 WHERE tenant_id = $1`,
      [tenantId]
    );

    // Enviar email de confirmação
    console.log(`Payment confirmed for tenant ${tenantId}`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const tenantId = (invoice.customer as any)?.metadata?.tenantId;
    if (!tenantId) return;

    // Marcar como past_due
    await this.db.query(
      `UPDATE subscriptions SET status = 'past_due' WHERE tenant_id = $1`,
      [tenantId]
    );

    console.log(`Payment failed for tenant ${tenantId}`);
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = (subscription.customer as any)?.metadata?.tenantId;
    if (!tenantId) return;

    await this.db.query(
      `UPDATE subscriptions SET status = 'canceled' WHERE tenant_id = $1`,
      [tenantId]
    );

    console.log(`Subscription canceled for tenant ${tenantId}`);
  }
}
