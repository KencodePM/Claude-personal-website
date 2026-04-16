import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { MessageStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { sendEmail } from '../lib/mailer';

const router = Router();

const contactSchema = z.object({
  senderName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(10, 'Message must be at least 10 characters'),
});

const messageStatusSchema = z.object({
  status: z.nativeEnum(MessageStatus),
});

const replySchema = z.object({
  replyBody: z.string().min(1, 'Reply body is required'),
});

const paginationSchema = z.object({
  page: z.string().default('1').transform(Number),
  limit: z.string().default('10').transform(Number),
  status: z.nativeEnum(MessageStatus).optional(),
});

// POST /api/contact (public)
router.post('/contact', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = contactSchema.parse(req.body);

    const message = await prisma.message.create({ data });

    // Check settings for email notification
    const settings = await prisma.siteSettings.findFirst();
    if (settings?.notifyOnMessage && settings?.notifyEmail) {
      try {
        await sendEmail({
          to: settings.notifyEmail,
          subject: `[Portfolio] New message: ${data.subject}`,
          html: `
            <h2>New Contact Message</h2>
            <p><strong>From:</strong> ${data.senderName} (${data.email})</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <hr />
            <p>${data.body.replace(/\n/g, '<br />')}</p>
            <hr />
            <p><small>Message ID: ${message.id}</small></p>
          `,
        });
      } catch (emailErr) {
        // Don't fail the request if email fails
        console.error('[Email] Failed to send notification:', emailErr);
      }
    }

    res.status(201).json({
      success: true,
      data: { message: 'Message sent successfully', id: message.id },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/messages (admin)
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, status } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/messages/:id (admin)
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!message) {
      throw createError('Message not found', 404);
    }

    // Auto-mark as READ when retrieved
    if (message.status === MessageStatus.UNREAD) {
      await prisma.message.update({
        where: { id: req.params.id },
        data: { status: MessageStatus.READ },
      });
      message.status = MessageStatus.READ;
    }

    res.json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
});

// PUT /api/messages/:id (admin) - update status
router.put('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = messageStatusSchema.parse(req.body);

    const existing = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw createError('Message not found', 404);
    }

    const message = await prisma.message.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
});

// POST /api/messages/:id/reply (admin)
router.post('/:id/reply', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { replyBody } = replySchema.parse(req.body);

    const message = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!message) {
      throw createError('Message not found', 404);
    }

    // Send reply email
    await sendEmail({
      to: message.email,
      subject: `Re: ${message.subject}`,
      html: `
        <p>${replyBody.replace(/\n/g, '<br />')}</p>
        <hr />
        <p><small>In reply to your message sent on ${message.createdAt.toLocaleDateString()}</small></p>
        <blockquote>
          <p><strong>${message.senderName}</strong> wrote:</p>
          <p>${message.body.replace(/\n/g, '<br />')}</p>
        </blockquote>
      `,
    });

    // Mark as REPLIED
    const updated = await prisma.message.update({
      where: { id: req.params.id },
      data: { status: MessageStatus.REPLIED },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/messages/:id (admin)
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!existing) throw createError('Message not found', 404);
    await prisma.message.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Deleted' } });
  } catch (err) {
    next(err);
  }
});

export default router;
