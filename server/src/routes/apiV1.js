import { Router } from 'express';

import authRoutes from './authRoutes.js';
import publicPackagesRoutes from './publicPackagesRoutes.js';
import publicAdventuresRoutes from './publicAdventuresRoutes.js';
import adminPackagesRoutes from './adminPackagesRoutes.js';
import adminAdventuresRoutes from './adminAdventuresRoutes.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    version: 'v1',
    endpoints: [
      '/health',
      '/api/v1/auth/login',
      '/api/v1/auth/refresh',
      '/api/v1/auth/logout',
      '/api/v1/packages',
      '/api/v1/packages/:slug',
      '/api/v1/adventures',
      '/api/v1/adventures/:slug',
      '/api/v1/admin/packages',
      '/api/v1/admin/adventures',
    ],
  });
});

router.use('/auth', authRoutes);
router.use('/packages', publicPackagesRoutes);
router.use('/adventures', publicAdventuresRoutes);

router.use('/admin/packages', adminPackagesRoutes);
router.use('/admin/adventures', adminAdventuresRoutes);

export default router;

