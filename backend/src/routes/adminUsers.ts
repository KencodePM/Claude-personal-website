import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();
router.use(requireAuth);

const INVITE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  return Array.from({ length: 8 }, () =>
    INVITE_CHARSET[Math.floor(Math.random() * INVITE_CHARSET.length)]
  ).join('');
}

// GET /api/admin/invite-codes
router.get('/invite-codes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const codes = await prisma.inviteCode.findMany({
      include: { portfolioUser: { select: { email: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: codes });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/invite-codes
router.post('/invite-codes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { count = 1 } = z.object({ count: z.number().int().min(1).max(10).default(1) }).parse(req.body);

    const created = [];
    for (let i = 0; i < count; i++) {
      let code: string;
      let attempts = 0;
      do {
        code = generateCode();
        attempts++;
        if (attempts > 20) throw createError('Failed to generate unique code', 500);
      } while (await prisma.inviteCode.findUnique({ where: { code } }));

      const invite = await prisma.inviteCode.create({ data: { code } });
      created.push(invite);
    }

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/invite-codes/:id
router.delete('/invite-codes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const invite = await prisma.inviteCode.findUnique({ where: { id } });
    if (!invite) throw createError('Invite code not found', 404);
    if (invite.usedAt !== null) throw createError('Cannot delete a used invite code', 400);
    await prisma.inviteCode.delete({ where: { id } });
    res.json({ success: true, data: { message: 'Deleted' } });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.portfolioUser.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        createdAt: true,
        portfolio: { select: { isPublished: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

export default router;
