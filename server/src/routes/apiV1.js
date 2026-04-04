import { Router } from 'express';

import authRoutes from './authRoutes.js';
import publicPackagesRoutes from './publicPackagesRoutes.js';
import publicAdventuresRoutes from './publicAdventuresRoutes.js';
import publicEnquiriesRoutes from './publicEnquiriesRoutes.js';
import publicContentRoutes from './publicContentRoutes.js';
import adminPackagesRoutes from './adminPackagesRoutes.js';
import adminAdventuresRoutes from './adminAdventuresRoutes.js';
import adminUploadsRoutes from './adminUploadsRoutes.js';
import adminDashboardRoutes from './adminDashboardRoutes.js';
import adminEnquiriesRoutes from './adminEnquiriesRoutes.js';
import adminContentRoutes from './adminContentRoutes.js';

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
      '/api/v1/enquiries',
      '/api/v1/content/home',
      '/api/v1/content/seo-revision',
      '/api/v1/admin/packages',
      '/api/v1/admin/adventures',
      '/api/v1/admin/uploads/media',
      '/api/v1/admin/dashboard/summary',
      '/api/v1/admin/enquiries',
      '/api/v1/admin/content/hero',
    ],
  });
});

router.use('/auth', authRoutes);
router.use('/packages', publicPackagesRoutes);
router.use('/adventures', publicAdventuresRoutes);
router.use('/enquiries', publicEnquiriesRoutes);
router.use('/content', publicContentRoutes);

router.use('/admin/packages', adminPackagesRoutes);
router.use('/admin/adventures', adminAdventuresRoutes);
router.use('/admin/uploads', adminUploadsRoutes);
router.use('/admin/dashboard', adminDashboardRoutes);
router.use('/admin/enquiries', adminEnquiriesRoutes);
router.use('/admin/content', adminContentRoutes);

export default router;

