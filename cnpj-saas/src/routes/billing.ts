import { Router, Request, Response } from 'express';
import { BillingService } from '../services/billing.service.js';
import { Database } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import Stripe from 'stripe';

const router = Router();
const db = new Database();
const billingService = new BillingService(db);

// Todos os endpoints requerem autenticação
router.use(authenticateToken);

/**
 * GET /api/billing/plans
 * Listar planos disponíveis
 */
router.get('/plans', (req: Request, res: Response) => {
  try {
    const plans = billingService.getPlans();
    res.json({
      success: true,
      data: Object.values(plans),
    });
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  }
});

/**
 * POST /api/billing/subscription
 * Criar nova subscription
 */
router.post('/subscription', async (req: Request, res: Response) => {
  try {
    const { planId, email, companyName } = req.body;
    const tenantId = (req as any).user.tenantId;

    const result = await billingService.createSubscription(
      tenantId,
      planId,
      email,
      companyName
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({ error: (error as any).message });
  }
});

/**
 * GET /api/billing/subscription
 * Obter subscription atual
 */
router.get('/subscription', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const subscription = await billingService.getSubscription(tenantId);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  }
});

/**
 * POST /api/billing/upgrade
 * Fazer upgrade de plano
 */
router.post('/upgrade', async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;
    const tenantId = (req as any).user.tenantId;

    const subscription = await billingService.upgradePlan(tenantId, planId);

    res.json({
      success: true,
      data: subscription,
      message: 'Plano atualizado com sucesso',
    });
  } catch (error) {
    res.status(400).json({ error: (error as any).message });
  }
});

/**
 * GET /api/billing/dashboard
 * Obter métricas do dashboard
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const metrics = await billingService.getDashboardMetrics(tenantId);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  }
});

/**
 * POST /api/billing/webhook
 * Webhook do Stripe
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    await billingService.processStripeWebhook(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

export default router;
