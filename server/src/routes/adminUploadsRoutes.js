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
const maxFileSizeMb = Number(process.env.ADMIN_UPLOAD_MAX_MB ?? 200);
const maxFileSizeBytes =
  Number.isFinite(maxFileSizeMb) && maxFileSizeMb > 0 ? Math.trunc(maxFileSizeMb * 1024 * 1024) : 200 * 1024 * 1024;

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
    fileSize: maxFileSizeBytes,
  },
  fileFilter: (_req, file, cb) => {
    if (imageMimeTypes.has(file.mimetype) || videoMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Unsupported file type'));
  },
});

router.post('/media', (req, res) => {
  uploader.array('files', 30)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: {
            message: `File too large. Max allowed per file is ${Math.round(maxFileSizeBytes / (1024 * 1024))}MB.`,
          },
        });
      }
      return res.status(400).json({
        error: {
          message: err?.message || 'Upload failed',
        },
      });
    }

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

    return res.status(201).json({ files: uploaded });
  });
});

export default router;
