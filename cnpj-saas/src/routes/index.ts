import { Router } from 'express';
import authRoutes from './auth.js';
import cnpjRoutes from './cnpj.js';
import licenseRoutes from './license.js';
import adminRoutes from './admin.js';
import billingRoutes from './billing.js';
import dashboardRoutes from './dashboard.js';

const router = Router();

// Health checks
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

// Rotas de API
router.use('/auth', authRoutes);
router.use('/cnpj', cnpjRoutes);
router.use('/licenses', licenseRoutes);
router.use('/admin', adminRoutes);
router.use('/billing', billingRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
