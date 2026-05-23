/**
 * Auth Routes
 * Endpoints de autenticação e gerenciamento de usuários
 */

import { Router, Request, Response, NextFunction } from 'express';
import authService from '../services/authService.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError, ErrorCodes } from '../types/index.js';

const router = Router();

/**
 * POST /api/auth/register
 * Registrar novo usuário
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, tenantId } = req.body;

    if (!email || !password || !tenantId) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        400,
        'Email, senha e tenantId são obrigatórios'
      );
    }

    const result = await authService.register(tenantId, {
      email,
      password,
      firstName,
      lastName,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Fazer login
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, tenantId } = req.body;

    if (!email || !password || !tenantId) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        400,
        'Email, senha e tenantId são obrigatórios'
      );
    }

    const result = await authService.login(tenantId, { email, password });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Obter dados do usuário autenticado
 */
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.context?.userId || !req.context?.tenantId) {
      throw new AppError(
        ErrorCodes.UNAUTHORIZED,
        401,
        'Usuário não autenticado'
      );
    }

    const user = await authService.getUserById(req.context.userId, req.context.tenantId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/me
 * Atualizar dados do usuário
 */
router.put('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.context?.userId || !req.context?.tenantId) {
      throw new AppError(
        ErrorCodes.UNAUTHORIZED,
        401,
        'Usuário não autenticado'
      );
    }

    const { firstName, lastName, password } = req.body;

    const user = await authService.updateUser(req.context.userId, req.context.tenantId, {
      firstName,
      lastName,
      password,
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/users
 * Listar usuários do tenant (requer autenticação)
 */
router.get('/users', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
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

    const result = await authService.listTenantUsers(req.context.tenantId, page, limit);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
