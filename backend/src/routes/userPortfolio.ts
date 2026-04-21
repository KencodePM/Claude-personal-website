import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { requireUserAuth } from '../middleware/userAuth';
import { createError } from '../middleware/errorHandler';

const router = Router();
router.use(requireUserAuth);

const portfolioUpdateSchema = z.object({
  isPublished: z.boolean().optional(),
  seoTitle: z.string().max(70).nullable().optional(),
  seoDescription: z.string().max(160).nullable().optional(),
  ogImageUrl: z.string().url().nullable().optional(),
});

// Canonical per-section data schemas. Fields are ALL optional (empty sections
// must be allowed), but unknown/misnamed keys are stripped via `.strict()` so
// clients get immediate feedback when they misspell a key.
const heroDataSchema = z.object({
  name: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  email: z.string().email().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  avatarUrl: z.string().url().optional().or(z.literal('')),
}).strict();

const aboutDataSchema = z.object({
  content: z.string().max(5000).optional(),
}).strict();

const experienceItemSchema = z.object({
  role: z.string().max(100),
  company: z.string().max(100),
  period: z.string().max(50),
  description: z.string().max(1000).optional(),
}).strict();
const experienceDataSchema = z.object({
  items: z.array(experienceItemSchema).max(50).optional(),
}).strict();

const projectItemSchema = z.object({
  title: z.string().max(100),
  description: z.string().max(1000).optional(),
  url: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string().max(30)).max(20).optional(),
}).strict();
const projectsDataSchema = z.object({
  items: z.array(projectItemSchema).max(50).optional(),
}).strict();

const skillGroupSchema = z.object({
  name: z.string().max(50),
  skills: z.array(z.string().max(50)).max(50),
}).strict();
const skillsDataSchema = z.object({
  groups: z.array(skillGroupSchema).max(20).optional(),
}).strict();

const educationItemSchema = z.object({
  school: z.string().max(100),
  degree: z.string().max(100),
  period: z.string().max(50),
}).strict();
const educationDataSchema = z.object({
  items: z.array(educationItemSchema).max(20).optional(),
}).strict();

const contactDataSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
}).strict();

// Discriminated-union so each type gets the right `data` schema
const sectionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('HERO'),       order: z.number().int().min(0), isVisible: z.boolean(), data: heroDataSchema }),
  z.object({ type: z.literal('ABOUT'),      order: z.number().int().min(0), isVisible: z.boolean(), data: aboutDataSchema }),
  z.object({ type: z.literal('EXPERIENCE'), order: z.number().int().min(0), isVisible: z.boolean(), data: experienceDataSchema }),
  z.object({ type: z.literal('PROJECTS'),   order: z.number().int().min(0), isVisible: z.boolean(), data: projectsDataSchema }),
  z.object({ type: z.literal('SKILLS'),     order: z.number().int().min(0), isVisible: z.boolean(), data: skillsDataSchema }),
  z.object({ type: z.literal('EDUCATION'),  order: z.number().int().min(0), isVisible: z.boolean(), data: educationDataSchema }),
  z.object({ type: z.literal('CONTACT'),    order: z.number().int().min(0), isVisible: z.boolean(), data: contactDataSchema }),
]);

const meUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

// GET /api/user/me
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.portfolioUser.findUnique({
      where: { id: req.portfolioUser!.userId },
      select: { id: true, email: true, username: true, displayName: true, createdAt: true },
    });
    if (!user) throw createError('User not found', 404);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/me
router.put('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { displayName, currentPassword, newPassword } = meUpdateSchema.parse(req.body);
    const updateData: { displayName?: string; passwordHash?: string } = {};

    if (displayName) updateData.displayName = displayName;

    if (currentPassword && newPassword) {
      const bcrypt = await import('bcryptjs');
      const user = await prisma.portfolioUser.findUnique({ where: { id: req.portfolioUser!.userId } });
      if (!user) throw createError('User not found', 404);
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) throw createError('Current password is incorrect', 401);
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.portfolioUser.update({
      where: { id: req.portfolioUser!.userId },
      data: updateData,
      select: { id: true, email: true, username: true, displayName: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// GET /api/user/portfolio
router.get('/portfolio', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: req.portfolioUser!.userId },
      include: { sections: { orderBy: { order: 'asc' } } },
    });
    if (!portfolio) throw createError('Portfolio not found', 404);
    res.json({ success: true, data: portfolio });
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/portfolio
router.put('/portfolio', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = portfolioUpdateSchema.parse(req.body);
    const portfolio = await prisma.portfolio.update({
      where: { userId: req.portfolioUser!.userId },
      data,
    });
    res.json({ success: true, data: portfolio });
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/portfolio/sections
// Accepts either a bare array body OR { sections: [...] } — both are
// valid and documented. Previously only bare array worked, which was
// confusing.
router.put('/portfolio/sections', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = Array.isArray(req.body) ? req.body : req.body?.sections;
    const sections = z.array(sectionSchema).max(20).parse(body);

    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: req.portfolioUser!.userId },
    });
    if (!portfolio) throw createError('Portfolio not found', 404);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.portfolioSection.deleteMany({ where: { portfolioId: portfolio.id } });
      await tx.portfolioSection.createMany({
        data: sections.map((s) => ({
          portfolioId: portfolio.id,
          type: s.type,
          order: s.order,
          isVisible: s.isVisible,
          data: s.data as Prisma.InputJsonObject,
        })),
      });
      return tx.portfolio.findUnique({
        where: { id: portfolio.id },
        include: { sections: { orderBy: { order: 'asc' } } },
      });
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
