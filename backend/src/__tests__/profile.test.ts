/**
 * Tests for backend/src/routes/profile.ts
 *
 * Covers:
 *  - GET / — returns { success, data } when profile exists; 404 when not found
 *  - PUT / — upserts (update when exists, create when not) and returns { success, data }
 *            requires auth
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
    profile: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import prisma from '../lib/prisma';
import profileRouter from '../routes/profile';

const prismaMock = prisma as jest.Mocked<typeof prisma>;
const JWT_SECRET = 'supersecret-for-testing-at-least-32chars!!';

function makeAuthToken(userId = 'admin-1', email = 'admin@example.com') {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/profile', profileRouter);
  app.use(errorHandler);
  return app;
}

const app = buildApp();

const fakeProfile = {
  id: 'profile-1',
  nameCn: '张三',
  nameEn: 'John Doe',
  title: 'Software Engineer',
  location: 'San Francisco, CA',
  email: 'john@example.com',
  phone: null,
  bio: 'A passionate developer',
  heroSubtitle: 'Building great software',
  linkedinUrl: null,
  githubUrl: 'https://github.com/johndoe',
  resumeUrl: null,
  stat1Num: '5+',
  stat1Label: 'Years of Experience',
  stat2Num: '50+',
  stat2Label: 'Projects',
  stat3Num: '20+',
  stat3Label: 'Happy Clients',
  updatedAt: new Date(),
};

describe('GET /api/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns { success: true, data: profile } when profile exists', async () => {
    (prismaMock.profile.findFirst as jest.Mock).mockResolvedValue(fakeProfile);

    const res = await request(app).get('/api/profile');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('profile-1');
    expect(res.body.data.nameEn).toBe('John Doe');
  });

  it('returns 404 when no profile found', async () => {
    (prismaMock.profile.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/profile');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('PUT /api/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no auth token provided', async () => {
    const res = await request(app).put('/api/profile').send({ nameEn: 'Jane Doe' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('updates existing profile (upsert path: profile found)', async () => {
    const updatedProfile = { ...fakeProfile, nameEn: 'Jane Doe' };
    (prismaMock.profile.findFirst as jest.Mock).mockResolvedValue(fakeProfile);
    (prismaMock.profile.update as jest.Mock).mockResolvedValue(updatedProfile);

    const token = makeAuthToken();
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ nameEn: 'Jane Doe' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nameEn).toBe('Jane Doe');
    expect(prismaMock.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'profile-1' } })
    );
    expect(prismaMock.profile.create).not.toHaveBeenCalled();
  });

  it('creates profile when none exists (upsert path: profile not found)', async () => {
    const createdProfile = { ...fakeProfile, id: 'profile-new' };
    (prismaMock.profile.findFirst as jest.Mock).mockResolvedValue(null);
    (prismaMock.profile.create as jest.Mock).mockResolvedValue(createdProfile);

    const token = makeAuthToken();
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ nameEn: 'Brand New' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('profile-new');
    expect(prismaMock.profile.create).toHaveBeenCalled();
    expect(prismaMock.profile.update).not.toHaveBeenCalled();
  });
});
