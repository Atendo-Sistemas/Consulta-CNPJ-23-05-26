/**
 * CNPJ SaaS - Backend
 * Aplicação principal com Express
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { AppError, ErrorCodes } from './types/index.js';

// Importar rotas
import authRoutes from './routes/auth.js';
import cnpjRoutes from './routes/cnpj.js';
import licenseRoutes from './routes/license.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware Global
// ============================================

// Segurança
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting global
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Muitas requisições, tente novamente mais tarde',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// ============================================
// Rotas de Saúde
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================
// Rotas da API
// ============================================

// Autenticação
app.use('/api/auth', authRoutes);

// CNPJ (requer autenticação)
app.use('/api/cnpj', cnpjRoutes);

// Licenças (requer autenticação)
app.use('/api/licenses', licenseRoutes);

// Admin (requer autenticação de admin)
app.use('/api/admin', adminRoutes);

// ============================================
// Rota 404
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: ErrorCodes.NOT_FOUND,
      message: 'Rota não encontrada',
    },
  });
});

// ============================================
// Error Handler Global
// ============================================

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'Erro interno do servidor',
    },
  });
});

// ============================================
// Iniciar Servidor
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   CNPJ SaaS - Backend                  ║
║   Servidor rodando na porta ${PORT}      ║
║   Ambiente: ${process.env.NODE_ENV || 'development'}          ║
╚════════════════════════════════════════╝
  `);
});

export default app;
