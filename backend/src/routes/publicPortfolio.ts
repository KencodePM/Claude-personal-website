import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { createError } from '../middleware/errorHandler';

const router = Router();

// GET /api/portfolio/:username
router.get('/:username', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;

    const user = await prisma.portfolioUser.findUnique({
      where: { username },
      select: {
        username: true,
        displayName: true,
        portfolio: {
          include: {
            sections: {
              where: { isVisible: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!user || !user.portfolio || !user.portfolio.isPublished) {
      throw createError('Portfolio not found', 404);
    }

    res.json({
      success: true,
      data: {
        user: { username: user.username, displayName: user.displayName },
        portfolio: {
          seoTitle: user.portfolio.seoTitle,
          seoDescription: user.portfolio.seoDescription,
          ogImageUrl: user.portfolio.ogImageUrl,
          sections: user.portfolio.sections,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
