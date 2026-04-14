import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { env } from '../config/env';
import { requireUserAuth } from '../middleware/userAuth';
import { createError } from '../middleware/errorHandler';

const router = Router();

const DEFAULT_SECTIONS = [
  { type: 'HERO' as const, order: 0 },
  { type: 'ABOUT' as const, order: 1 },
  { type: 'EXPERIENCE' as const, order: 2 },
  { type: 'PROJECTS' as const, order: 3 },
  { type: 'SKILLS' as const, order: 4 },
  { type: 'EDUCATION' as const, order: 5 },
  { type: 'CONTACT' as const, order: 6 },
];

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
  displayName: z.string().min(1).max(100),
  inviteCode: z.string().length(8, 'Invite code must be 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/user/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, username, displayName, inviteCode } = registerSchema.parse(req.body);

    const invite = await prisma.inviteCode.findUnique({ where: { code: inviteCode } });
    if (!invite || invite.usedAt !== null) {
      throw createError('Invalid or already used invite code', 400);
    }

    const [existingEmail, existingUsername] = await Promise.all([
      prisma.portfolioUser.findUnique({ where: { email } }),
      prisma.portfolioUser.findUnique({ where: { username } }),
    ]);
    if (existingEmail) throw createError('Email already in use', 409);
    if (existingUsername) throw createError('Username already taken', 409);

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      await tx.inviteCode.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });

      const newUser = await tx.portfolioUser.create({
        data: {
          email,
          passwordHash,
          username,
          displayName,
          inviteCodeId: invite.id,
          portfolio: {
            create: {
              sections: {
                create: DEFAULT_SECTIONS.map((s) => ({
                  type: s.type,
                  order: s.order,
                  isVisible: true,
                  data: {},
                })),
              },
            },
          },
        },
      });
      return newUser;
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      env.USER_JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.status(201).json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName } },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/user/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.portfolioUser.findUnique({ where: { email } });
    if (!user) throw createError('Invalid email or password', 401);

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw createError('Invalid email or password', 401);

    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      env.USER_JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName } },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/user/logout
router.post('/logout', requireUserAuth, (req: Request, res: Response) => {
  res.json({ success: true, data: { message: 'Logged out successfully' } });
});

// GET /api/auth/user/me
router.get('/me', requireUserAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.portfolioUser.findUnique({
      where: { id: req.portfolioUser!.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        createdAt: true,
        portfolio: { select: { isPublished: true } },
      },
    });
    if (!user) throw createError('User not found', 404);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export default router;
