/**
 * Rotas de Admin
 * Endpoints administrativos para gerenciar resellers, licenças e relatórios
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { AppError, ErrorCodes } from '../types/index.js';
import adminService from '../services/adminService.js';

const router = Router();

/**
 * Middleware para verificar se é admin
 */
function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.context?.user?.role !== 'admin') {
    throw new AppError(
      ErrorCodes.FORBIDDEN,
      403,
      'Acesso negado: apenas administradores'
    );
  }
  next();
}

/**
 * GET /api/admin/stats
 * Obter estatísticas globais
 */
router.get(
  '/stats',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await adminService.getGlobalStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/resellers
 * Listar resellers com paginação e filtros
 */
router.get(
  '/resellers',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
      };

      const result = await adminService.listResellers(page, limit, filters);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/resellers/:tenantId
 * Obter detalhes de um reseller
 */
router.get(
  '/resellers/:tenantId',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const details = await adminService.getResellerDetails(tenantId);
      res.json({ success: true, data: details });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/admin/resellers/:tenantId
 * Atualizar dados de um reseller
 */
router.put(
  '/resellers/:tenantId',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const { name, email, isActive, branding } = req.body;

      const updated = await adminService.updateReseller(tenantId, {
        name,
        email,
        isActive,
        branding,
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/licenses
 * Listar todas as licenças com paginação e filtros
 */
router.get(
  '/licenses',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filters = {
        tenantId: req.query.tenantId as string,
        status: req.query.status as string,
      };

      const result = await adminService.listLicenses(page, limit, filters);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/licenses/create
 * Criar nova licença
 */
router.post(
  '/licenses/create',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, ipAddress, queriesLimit } = req.body;

      if (!tenantId || !ipAddress) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          400,
          'tenantId e ipAddress são obrigatórios'
        );
      }

      const license = await adminService.createLicense({
        tenantId,
        ipAddress,
        queriesLimit: queriesLimit || 1000,
      });

      res.json({ success: true, data: license });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/admin/licenses/:licenseId/renew
 * Renovar licença
 */
router.put(
  '/licenses/:licenseId/renew',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { licenseId } = req.params;
      const { days } = req.body;

      const renewed = await adminService.renewLicense(licenseId, days || 30);
      res.json({ success: true, data: renewed });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/admin/licenses/:licenseId
 * Revogar licença
 */
router.delete(
  '/licenses/:licenseId',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { licenseId } = req.params;
      await adminService.revokeLicense(licenseId);
      res.json({ success: true, message: 'Licença revogada com sucesso' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/reports/resellers
 * Relatório de uso por reseller
 */
router.get(
  '/reports/resellers',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const report = await adminService.getResellerUsageReport(startDate, endDate);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/reports/revenue
 * Relatório de receita
 */
router.get(
  '/reports/revenue',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const report = await adminService.getRevenueReport(startDate, endDate);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
