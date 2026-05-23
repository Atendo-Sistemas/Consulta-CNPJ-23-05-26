/**
 * CNPJ Routes
 * Endpoints para consulta de CNPJ
 */

import { Router, Request, Response, NextFunction } from 'express';
import cnpjService from '../services/cnpjService.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError, ErrorCodes } from '../types/index.js';

const router = Router();

/**
 * POST /api/cnpj/query
 * Realizar consulta de CNPJ
 */
router.post('/query', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.context?.userId || !req.context?.tenantId) {
      throw new AppError(
        ErrorCodes.UNAUTHORIZED,
        401,
        'Usuário não autenticado'
      );
    }

    const { cnpj } = req.body;

    if (!cnpj) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        400,
        'CNPJ é obrigatório'
      );
    }

    const result = await cnpjService.performQuery(
      req.context.tenantId,
      req.context.userId,
      cnpj,
      req.context.ipAddress,
      req.context.userAgent
    );

    res.json({
      success: true,
      data: result.data,
      history: result.history,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cnpj/history
 * Obter histórico de consultas
 */
router.get('/history', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.context?.tenantId) {
      throw new AppError(
        ErrorCodes.UNAUTHORIZED,
        401,
        'Tenant não identificado'
      );
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const result = await cnpjService.getQueryHistory(
      req.context.tenantId,
      page,
      limit,
      {
        userId: req.query.userId as string | undefined,
        status,
        startDate,
        endDate,
      }
    );

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cnpj/stats
 * Obter estatísticas de consultas
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.context?.tenantId) {
      throw new AppError(
        ErrorCodes.UNAUTHORIZED,
        401,
        'Tenant não identificado'
      );
    }

    const days = parseInt(req.query.days as string) || 30;
    const stats = await cnpjService.getQueryStats(req.context.tenantId, days);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cnpj/dashboard
 * Obter dados do dashboard
 */
router.get('/dashboard', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.context?.tenantId) {
      throw new AppError(
        ErrorCodes.UNAUTHORIZED,
        401,
        'Tenant não identificado'
      );
    }

    const stats = await cnpjService.getDashboardStats(req.context.tenantId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
