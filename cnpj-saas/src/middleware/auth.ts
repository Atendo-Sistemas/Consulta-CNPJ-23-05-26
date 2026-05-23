/**
 * Authentication Middleware
 * Validação de JWT e contexto de requisição
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, RequestContext, AppError, ErrorCodes } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AppError(
        ErrorCodes.UNAUTHORIZED,
        401,
        'Token não fornecido'
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production'
    ) as JWTPayload;

    req.context = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Token inválido ou expirado',
        },
      });
    } else if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Erro interno do servidor',
        },
      });
    }
  }
}

export function licenseMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const licenseKey = req.headers['x-license-key'] as string;
    const ipAddress = getClientIp(req);

    if (!licenseKey) {
      throw new AppError(
        ErrorCodes.INVALID_LICENSE,
        401,
        'Chave de licença não fornecida'
      );
    }

    // Validação será feita no serviço de licença
    req.context = {
      ...req.context,
      ipAddress,
      userAgent: req.get('user-agent'),
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Erro interno do servidor',
        },
      });
    }
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production'
      ) as JWTPayload;

      req.context = {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        ipAddress: getClientIp(req),
        userAgent: req.get('user-agent'),
      };
    } else {
      req.context = {
        ipAddress: getClientIp(req),
        userAgent: req.get('user-agent'),
      };
    }

    next();
  } catch (error) {
    // Ignora erros de autenticação opcional
    req.context = {
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    };
    next();
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    (req.socket.remoteAddress as string) ||
    'unknown'
  );
}

export function generateToken(userId: string, tenantId: string, email: string, role: string): string {
  return jwt.sign(
    {
      userId,
      tenantId,
      email,
      role,
    },
    process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
    {
      expiresIn: process.env.JWT_EXPIRATION || '7d',
    }
  );
}
