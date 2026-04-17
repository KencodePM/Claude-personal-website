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

    // 真的找不到這個 user / portfolio -> 404
    if (!user || !user.portfolio) {
      throw createError('Portfolio not found', 404);
    }

    // 存在但尚未發布 -> 200 + 特殊狀態，讓前端可以顯示「作者尚未公開」
    if (!user.portfolio.isPublished) {
      return res.json({
        success: true,
        data: {
          status: 'UNPUBLISHED',
          user: { username: user.username, displayName: user.displayName },
        },
      });
    }

    res.json({
      success: true,
      data: {
        status: 'PUBLISHED',
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
