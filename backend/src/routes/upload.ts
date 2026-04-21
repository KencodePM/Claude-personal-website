import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import { requireUserAuth } from '../middleware/userAuth';
import { createError } from '../middleware/errorHandler';

const router = Router();

// 4 MB per upload is plenty for an OG image (Vercel Blob free tier hosts them
// happily and most og:image consumers prefer ~1200×630 JPEG/PNG < 1 MB).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) {
      cb(new Error('Only PNG / JPEG / WebP / GIF images are allowed'));
      return;
    }
    cb(null, true);
  },
});

// POST /api/user/upload/og-image
// Multipart/form-data with a single `file` field. Returns { url } on success.
// Requires BLOB_READ_WRITE_TOKEN to be set on Render; otherwise returns 503
// with a clear message so the admin knows how to enable the feature.
router.post(
  '/og-image',
  requireUserAuth,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw createError(
          'OG image upload not configured. Set BLOB_READ_WRITE_TOKEN in Render to enable.',
          503
        );
      }
      if (!req.file) throw createError('No file provided', 400);

      const ext = req.file.mimetype.split('/')[1].replace('jpeg', 'jpg');
      const key = `og-images/${req.portfolioUser!.username}-${Date.now()}.${ext}`;

      const blob = await put(key, req.file.buffer, {
        access: 'public',
        contentType: req.file.mimetype,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
      });

      res.status(201).json({ success: true, data: { url: blob.url } });
    } catch (err) {
      // Multer errors (file too large, wrong mimetype) surface as regular Errors
      if (err instanceof Error && err.message.includes('File too large')) {
        next(createError('Image must be 4 MB or smaller', 413));
        return;
      }
      next(err);
    }
  }
);

export default router;
