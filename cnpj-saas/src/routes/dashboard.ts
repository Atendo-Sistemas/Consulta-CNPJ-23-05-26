import { Router, Request, Response } from 'express';
import { Database } from '../db/index.js';
import { BillingService } from '../services/billing.service.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuid } from 'uuid';
import { startOfMonth } from 'date-fns';

const router = Router();
const db = new Database();
const billingService = new BillingService(db);

router.use(authenticateToken);

/**
 * GET /api/dashboard/overview
 * Visão geral do dashboard
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;

    const metrics = await billingService.getDashboardMetrics(tenantId);

    // Obter últimas consultas
    const queryResult = await db.query(
      `SELECT cnpj, razao_social, created_at FROM query_history
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        usage: metrics.usage,
        subscription: metrics.subscription,
        remaining: metrics.remaining,
        daysUntilRenewal: metrics.daysUntilRenewal,
        estimatedOverage: metrics.estimatedOverage,
        canUpgrade: metrics.canUpgrade,
        trend: metrics.trend,
        recentQueries: queryResult.rows.map((row: any) => ({
          cnpj: row.cnpj,
          razaoSocial: row.razao_social,
          queriedAt: row.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: (error as any).message });
  }
});

/**
 * GET /api/dashboard/usage
 * Detalhes de uso com gráfico
 */
router.get('/usage', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const days = parseInt(req.query.days as string) || 30;

    const metrics = await billingService.getDashboardMetrics(tenantId);

    res.json({
      success: true,
      data: {
        total: metrics.usage.thisMonth,
        limit: metrics.usage.limit,
        percentage: metrics.usage.percentage,
        chart: metrics.usage.dailyChart,
        period: { start: startOfMonth(new Date()), days },
      },
    });
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  }
});

/**
 * GET /api/dashboard/query-history
 * Histórico completo de consultas
 */
router.get('/query-history', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT cnpj, razao_social, created_at FROM query_history
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM query_history WHERE tenant_id = $1',
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        queries: result.rows.map((row: any) => ({
          cnpj: row.cnpj,
          razaoSocial: row.razao_social,
          queriedAt: row.created_at,
        })),
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].count, 10),
          pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  }
});

/**
 * GET /api/dashboard/top-companies
 * Top empresas consultadas
 */
router.get('/top-companies', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await db.query(
      `SELECT cnpj, razao_social, COUNT(*) as queries
       FROM query_history
       WHERE tenant_id = $1
       GROUP BY cnpj, razao_social
       ORDER BY queries DESC
       LIMIT $2`,
      [tenantId, limit]
    );

    res.json({
      success: true,
      data: result.rows.map((row: any) => ({
        cnpj: row.cnpj,
        razaoSocial: row.razao_social,
        queries: parseInt(row.queries, 10),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  }
});

/**
 * GET /api/dashboard/stats
 * Estatísticas gerais
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const monthStart = startOfMonth(new Date());

    // Total de queries
    const queriesResult = await db.query(
      `SELECT COUNT(*) as count FROM query_history
       WHERE tenant_id = $1 AND created_at >= $2`,
      [tenantId, monthStart]
    );

    // Empresas únicas
    const companiesResult = await db.query(
      `SELECT COUNT(DISTINCT cnpj) as count FROM query_history
       WHERE tenant_id = $1 AND created_at >= $2`,
      [tenantId, monthStart]
    );

    // Queries por dia (últimos 7 dias)
    const dailyResult = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM query_history
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        queriesThisMonth: parseInt(queriesResult.rows[0].count, 10),
        uniqueCompanies: parseInt(companiesResult.rows[0].count, 10),
        last7Days: dailyResult.rows.map((row: any) => ({
          date: row.date,
          queries: parseInt(row.count, 10),
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  }
});

export default router;
