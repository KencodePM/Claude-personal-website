/**
 * Tests for backend/src/routes/messages.ts
 *
 * Covers:
 *  - GET / (list with pagination) — requires auth
 *  - POST /contact (public) — valid and invalid body
 *  - DELETE /:id (auth guard, not found, success)
 */

import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../middleware/errorHandler';

// ── env stubs ─────────────────────────────────────────────────────────────────
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
process.env.JWT_SECRET = 'supersecret-for-testing-at-least-32chars!!';
process.env.USER_JWT_SECRET = 'user-supersecret-for-testing-at-least-32chars!!';
process.env.NODE_ENV = 'test';

// ── mock prisma ────────────────────────────────────────────────────────────────
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    message: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    siteSettings: {
      findFirst: jest.fn(),
    },
  },
}));

// ── mock mailer ────────────────────────────────────────────────────────────────
jest.mock('../lib/mailer', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

import prisma from '../lib/prisma';
import messagesRouter from '../routes/messages';

const prismaMock = prisma as jest.Mocked<typeof prisma>;

const JWT_SECRET = 'supersecret-for-testing-at-least-32chars!!';

function makeAuthToken(userId = 'admin-1', email = 'admin@example.com') {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/messages', messagesRouter);
  // Public contact endpoint is mounted at /api/contact
  app.use('/api', messagesRouter);
  app.use(errorHandler);
  return app;
}

const app = buildApp();

describe('GET /api/messages (list with pagination)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no auth token provided', async () => {
    const res = await request(app).get('/api/messages');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns paginated message list with valid token', async () => {
    const fakeMessages = [
      { id: 'msg-1', senderName: 'Alice', email: 'alice@example.com', subject: 'Hello', body: 'Test body', status: 'UNREAD', createdAt: new Date() },
    ];
    (prismaMock.message.findMany as jest.Mock).mockResolvedValue(fakeMessages);
    (prismaMock.message.count as jest.Mock).mockResolvedValue(1);

    const token = makeAuthToken();
    const res = await request(app)
      .get('/api/messages')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.messages).toHaveLength(1);
    expect(res.body.data.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('respects page and limit query params', async () => {
    (prismaMock.message.findMany as jest.Mock).mockResolvedValue([]);
    (prismaMock.message.count as jest.Mock).mockResolvedValue(25);

    const token = makeAuthToken();
    const res = await request(app)
      .get('/api/messages?page=2&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.pagination).toMatchObject({
      page: 2,
      limit: 5,
      total: 25,
      totalPages: 5,
    });

    // Verify skip was calculated correctly
    const findManyCall = (prismaMock.message.findMany as jest.Mock).mock.calls[0][0];
    expect(findManyCall.skip).toBe(5); // (2-1) * 5
    expect(findManyCall.take).toBe(5);
  });
});

describe('POST /api/contact (public)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a message and returns 201 on valid body', async () => {
    const fakeMessage = { id: 'msg-new', senderName: 'Bob', email: 'bob@example.com', subject: 'Hi', body: 'Hello world this is a test' };
    (prismaMock.message.create as jest.Mock).mockResolvedValue(fakeMessage);
    (prismaMock.siteSettings.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/contact')
      .send({
        senderName: 'Bob',
        email: 'bob@example.com',
        subject: 'Hi',
        body: 'Hello world this is a test',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('msg-new');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ email: 'bob@example.com' }); // missing senderName, subject, body

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when body is too short (< 10 chars)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        senderName: 'Bob',
        email: 'bob@example.com',
        subject: 'Hi',
        body: 'Short',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when email is invalid', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        senderName: 'Bob',
        email: 'not-an-email',
        subject: 'Hi',
        body: 'Hello world this is a test',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('DELETE /api/messages/:id (admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no auth token provided', async () => {
    const res = await request(app).delete('/api/messages/msg-1');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 404 when message does not exist', async () => {
    (prismaMock.message.findUnique as jest.Mock).mockResolvedValue(null);

    const token = makeAuthToken();
    const res = await request(app)
      .delete('/api/messages/nonexistent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('successfully deletes an existing message', async () => {
    const fakeMessage = { id: 'msg-1', senderName: 'Alice', email: 'alice@example.com', subject: 'Hello', body: 'Test body', status: 'UNREAD', createdAt: new Date() };
    (prismaMock.message.findUnique as jest.Mock).mockResolvedValue(fakeMessage);
    (prismaMock.message.delete as jest.Mock).mockResolvedValue(fakeMessage);

    const token = makeAuthToken();
    const res = await request(app)
      .delete('/api/messages/msg-1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Deleted');
    expect(prismaMock.message.delete).toHaveBeenCalledWith({ where: { id: 'msg-1' } });
  });
});
