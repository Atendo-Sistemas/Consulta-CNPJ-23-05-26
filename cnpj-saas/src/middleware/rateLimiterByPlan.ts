import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { AppError, ErrorCodes } from '../types/index.js';
import { BillingService } from '../services/billing.service.js';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export function createRateLimiterMiddleware(billingService: BillingService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Obter subscription
      const subscription = await billingService.getSubscription(tenantId);
      if (!subscription) {
        return res.status(402).json({
          error: 'Subscription required',
          message: 'Por favor, configure uma assinatura',
        });
      }

      // Verificar status
      if (subscription.status === 'canceled') {
        return res.status(402).json({
          error: 'Subscription canceled',
          message: 'Sua assinatura foi cancelada',
        });
      }

      if (subscription.status === 'past_due') {
        return res.status(402).json({
          error: 'Payment overdue',
          message: 'Pagamento vencido. Por favor, atualize seus dados de cobrança',
        });
      }

      // Obter quota do mês
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const key = `quota:${tenantId}:${currentMonth}`;

      const used = parseInt((await redis.get(key)) || '0', 10);

      // Verificar se atingiu limite
      if (used >= subscription.queryQuota) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Você atingiu sua cota mensal de consultas',
          limit: subscription.queryQuota,
          used,
          retryAfter: getNextMonthDate(),
          canUpgrade: true,
        });
      }

      // Headers informativos
      res.set('X-RateLimit-Limit', subscription.queryQuota.toString());
      res.set('X-RateLimit-Remaining', (subscription.queryQuota - used - 1).toString());
      res.set(
        'X-RateLimit-Reset',
        getNextMonthDate().toISOString()
      );

      // Interceptar resposta para contar a query
      const originalJson = res.json.bind(res);
      res.json = function (data: any) {
        // Só contar se foi sucesso (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.incr(key);
          redis.expire(key, getSecondsUntilMonthEnd());
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      next();
    }
  };
}

function getNextMonthDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

function getSecondsUntilMonthEnd(): number {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.floor((nextMonth.getTime() - now.getTime()) / 1000);
}
