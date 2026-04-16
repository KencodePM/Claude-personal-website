/**
 * Tests for backend/src/routes/auth.ts
 *
 * Strategy: mount just the auth router on a minimal Express app, then hit it
 * with supertest. Prisma and bcrypt are mocked entirely so no real DB or
 * hashing occurs.
 *
 * Environment prerequisites (set once in beforeAll):
 *   DATABASE_URL, JWT_SECRET, USER_JWT_SECRET
 */

import express from 'express';
import request from 'supertest';
import { errorHandler } from '../middleware/errorHandler';

// ── env stubs (must happen before any module that imports ../config/env) ──────
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
process.env.JWT_SECRET = 'supersecret-for-testing-at-least-32chars!!';
process.env.USER_JWT_SECRET = 'user-supersecret-for-testing-at-least-32chars!!';
process.env.NODE_ENV = 'test';

// ── mock prisma ────────────────────────────────────────────────────────────────
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// ── mock bcryptjs ──────────────────────────────────────────────────────────────
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import authRouter from '../routes/auth';

const prismaMock = prisma as jest.Mocked<typeof prisma>;
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

// Build minimal app
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use(errorHandler);
  return app;
}

describe('POST /api/auth/login', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 with token on successful login', async () => {
    const fakeUser = {
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin',
      passwordHash: '$2a$10$hashedpassword',
    };

    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(fakeUser);
    (bcryptMock.compare as jest.Mock).mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'correctpassword' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('admin@example.com');
  });

  it('returns 401 when password does not match', async () => {
    const fakeUser = {
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin',
      passwordHash: '$2a$10$hashedpassword',
    };

    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(fakeUser);
    (bcryptMock.compare as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  it('returns 401 when user does not exist', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'anypassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  it('returns 400 when body is invalid (missing fields)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email' }); // missing password

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
