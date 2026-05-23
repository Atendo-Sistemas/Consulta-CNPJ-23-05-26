/**
 * License Routes
 * Endpoints para validação e gerenciamento de licenças
 */

import { Router, Request, Response, NextFunction } from 'express';
import licenseService from '../services/licenseService.js';
import { authMiddleware, licenseMiddleware } from '../middleware/auth.js';
import { AppError, ErrorCodes } from '../types/index.js';

const router = Router();

/**
 * POST /api/licenses/validate
 * Validar licença (sem autenticação)
 */
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { licenseKey, ipAddress, hostname } = req.body;

    if (!licenseKey || !ipAddress) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        400,
        'licenseKey e ipAddress são obrigatórios'
      );
    }

    const result = await licenseService.validateLicense({
      licenseKey,
      ipAddress,
      hostname,
    });

    res.json({
      success: result.isValid,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/licenses/me
 * Obter licença do usuário autenticado
 */
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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

    const result = await licenseService.listTenantLicenses(req.context.tenantId, page, limit);

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
 * GET /api/licenses/:id/stats
 * Obter estatísticas de uma licença
 */
router.get('/:id/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await licenseService.getLicenseStats(req.params.id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/licenses/:id/renew
 * Renovar uma licença (requer autenticação de admin)
 */
router.post('/:id/renew', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { validDays } = req.body;

    const license = await licenseService.renewLicense(req.params.id, validDays || 30);

    res.json({
      success: true,
      data: license,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
