import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

import { requireAdminJwt } from '../middleware/adminAuth.js';

const router = Router();
router.use(requireAdminJwt);

const uploadsRoot = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const videoMimeTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const dir = file.mimetype.startsWith('video/') ? 'videos' : 'images';
    const outDir = path.join(uploadsRoot, dir);
    fs.mkdirSync(outDir, { recursive: true });
    cb(null, outDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext || (file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    cb(null, `${unique}${safeExt}`);
  },
});

const uploader = multer({
  storage,
  limits: {
    files: 30,
    fileSize: 30 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (imageMimeTypes.has(file.mimetype) || videoMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Unsupported file type'));
  },
});

router.post('/media', uploader.array('files', 30), (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  const uploaded = files.map((f) => {
    const sub = f.mimetype.startsWith('video/') ? 'videos' : 'images';
    return {
      type: f.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE',
      srcUrl: `/uploads/${sub}/${f.filename}`,
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
    };
  });

  res.status(201).json({ files: uploaded });
});

export default router;
