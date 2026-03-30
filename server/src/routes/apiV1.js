import { Router } from 'express';

const router = Router();

// Router shell: expand in later releases.
router.get('/', (_req, res) => {
  res.json({
    version: 'v1',
    endpoints: [],
  });
});

export default router;

