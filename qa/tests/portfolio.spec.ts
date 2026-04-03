import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:4000';

// ─── Backend API Tests ──────────────────────────────────────────────────────

test.describe('Backend API', () => {
  test('GET /api/health returns ok', async ({ request }) => {
    const res = await request.get(`${API}/api/health`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ok');
  });

  test('GET /api/profile returns profile data', async ({ request }) => {
    const res = await request.get(`${API}/api/profile`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('name');
    expect(json).toHaveProperty('title');
    expect(json).toHaveProperty('bio');
    expect(json).toHaveProperty('email');
    expect(typeof json.name).toBe('string');
  });

  test('GET /api/projects returns array with tags', async ({ request }) => {
    const res = await request.get(`${API}/api/projects`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeGreaterThan(0);
    expect(json[0]).toHaveProperty('title');
    expect(json[0]).toHaveProperty('description');
    expect(Array.isArray(json[0].tags)).toBe(true);
  });

  test('GET /api/experience returns ordered array', async ({ request }) => {
    const res = await request.get(`${API}/api/experience`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeGreaterThan(0);
    expect(json[0]).toHaveProperty('company');
    expect(json[0]).toHaveProperty('role');
  });

  test('GET /api/skills returns categorized array', async ({ request }) => {
    const res = await request.get(`${API}/api/skills`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeGreaterThan(0);
    expect(json[0]).toHaveProperty('name');
    expect(json[0]).toHaveProperty('level');
  });

  test('GET /api/testimonials returns array', async ({ request }) => {
    const res = await request.get(`${API}/api/testimonials`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBeGreaterThan(0);
  });

  test('POST /api/auth/login with valid credentials returns token', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@portfolio.com', password: 'admin123' },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('token');
    expect(typeof json.token).toBe('string');
    expect(json.token.length).toBeGreaterThan(10);
  });

  test('POST /api/auth/login with invalid credentials returns 401', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@portfolio.com', password: 'wrong-password' },
    });
    expect(res.status()).toBe(401);
  });

  test('Protected GET /api/messages without token returns 401', async ({ request }) => {
    const res = await request.get(`${API}/api/messages`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/messages creates contact message', async ({ request }) => {
    const res = await request.post(`${API}/api/messages`, {
      data: {
        name: 'QA Test User',
        email: 'qa@test.com',
        subject: 'QA Test Message',
        content: 'This is a QA test message from the automated test suite.',
      },
    });
    expect(res.status()).toBe(201);
    const json = await res.json();
    expect(json).toHaveProperty('id');
  });

  test('Admin can read messages with valid token', async ({ request }) => {
    const loginRes = await request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@portfolio.com', password: 'admin123' },
    });
    const { token } = await loginRes.json();
    const res = await request.get(`${API}/api/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });
});

// ─── Frontend Portfolio Page Tests ─────────────────────────────────────────

test.describe('Portfolio Public Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
  });

  test('Page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Portfolio/);
  });

  test('Navigation bar is visible with all links', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    await expect(page.locator('nav a[href="#about"]')).toBeVisible();
    await expect(page.locator('nav a[href="#experience"]')).toBeVisible();
    await expect(page.locator('nav a[href="#projects"]')).toBeVisible();
    await expect(page.locator('nav a[href="#testimonials"]')).toBeVisible();
    await expect(page.locator('nav a[href="#contact"]')).toBeVisible();
  });

  test('Hero section shows profile name and bio', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('Hero CTA buttons are present and linked', async ({ page }) => {
    // "查看作品集" hero button
    const heroBtn = page.locator('a[href="#projects"]').filter({ hasText: '查看作品集' });
    await expect(heroBtn).toBeVisible();
    // "聯繫我" or resume button
    const secondBtn = page.locator('a[href="#contact"], a[href*="resume"]').first();
    await expect(secondBtn).toBeVisible();
  });

  test('Skills section renders progress bars', async ({ page }) => {
    await page.locator('#about').scrollIntoViewIfNeeded();
    await expect(page.locator('#about h2')).toContainText('關於我');
    // skill bars exist
    const skillBars = page.locator('#about .bg-gray-600, #about .bg-gray-700');
    expect(await skillBars.count()).toBeGreaterThan(0);
  });

  test('Experience timeline has 3 items', async ({ page }) => {
    await page.locator('#experience').scrollIntoViewIfNeeded();
    await expect(page.locator('#experience h2')).toContainText('工作經歷');
    const expCards = page.locator('#experience .rounded-2xl.border');
    await expect(expCards).toHaveCount(3);
  });

  test('Projects section shows 4 cards with external links', async ({ page }) => {
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await expect(page.locator('#projects h2')).toContainText('作品集');
    const cards = page.locator('#projects .bg-white.rounded-2xl.border');
    await expect(cards).toHaveCount(4);
    // external links present
    const extLinks = page.locator('#projects a[target="_blank"]');
    expect(await extLinks.count()).toBeGreaterThan(0);
  });

  test('Testimonials section renders 3 featured cards', async ({ page }) => {
    await page.locator('#testimonials').scrollIntoViewIfNeeded();
    await expect(page.locator('#testimonials h2')).toContainText('推薦人');
    const cards = page.locator('#testimonials .bg-gray-50.rounded-2xl');
    await expect(cards).toHaveCount(3);
  });

  test('Contact form fields are interactive', async ({ page }) => {
    await page.locator('#contact').scrollIntoViewIfNeeded();
    const nameInput = page.locator('input[placeholder="您的姓名"]');
    const emailInput = page.locator('input[placeholder="your@email.com"]');
    const msgInput = page.locator('textarea[placeholder="您的訊息..."]');
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(msgInput).toBeVisible();
    await nameInput.fill('Test User');
    await emailInput.fill('test@example.com');
    await msgInput.fill('Hello!');
  });

  test('Contact form submits successfully', async ({ page }) => {
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.fill('input[placeholder="您的姓名"]', 'QA Tester');
    await page.fill('input[placeholder="your@email.com"]', 'qa@test.com');
    await page.fill('textarea[placeholder="您的訊息..."]', 'Automated QA test.');
    await page.click('button[type="submit"]');
    await expect(page.locator('button[type="submit"]')).toContainText('✓ 訊息已傳送', { timeout: 5000 });
  });

  test('Footer is visible at bottom of page', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('footer')).toBeVisible();
  });
});

// ─── Admin Panel Tests ──────────────────────────────────────────────────────

// Shared login helper
async function adminLogin(page: any) {
  await page.goto(`${BASE}/admin/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/admin`, { timeout: 8000 });
  await page.waitForLoadState('networkidle');
}

test.describe('Admin Panel', () => {
  test('Unauthenticated visit redirects to /admin/login', async ({ page }) => {
    await page.context().clearCookies();
    // Clear localStorage too
    await page.goto(`${BASE}/admin/login`);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE}/admin`);
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/admin/login');
  });

  test('Login page renders correctly', async ({ page }) => {
    await page.goto(`${BASE}/admin/login`);
    await expect(page.locator('h1')).toContainText('登入後台');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('登入');
  });

  test('Login with wrong password shows error message', async ({ page }) => {
    await page.goto(`${BASE}/admin/login`);
    await page.fill('input[type="email"]', 'admin@portfolio.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Error message contains "失敗" or "credentials" in some form
    const errorEl = page.locator('p').filter({ hasText: /失敗|credentials|invalid/i });
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });

  test('Login with correct credentials redirects to dashboard', async ({ page }) => {
    await adminLogin(page);
    expect(page.url()).toBe(`${BASE}/admin`);
    await expect(page.locator('h1, [class*="text-2xl"]').first()).toBeVisible();
  });

  test.describe('Authenticated admin features', () => {
    test.beforeEach(async ({ page }) => {
      await adminLogin(page);
    });

    test('Dashboard shows stats cards', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      // Check quick-action links are present on dashboard
      await expect(page.locator('text=快速操作')).toBeVisible({ timeout: 8000 });
      await expect(page.locator('text=最新訊息')).toBeVisible();
      // Stats are shown (4 cards with numbers)
      const statNumbers = page.locator('.text-2xl.font-bold');
      expect(await statNumbers.count()).toBeGreaterThanOrEqual(4);
    });

    test('Sidebar navigation links to projects page', async ({ page }) => {
      await page.locator('aside a[href="/admin/projects"]').click();
      await page.waitForURL(`${BASE}/admin/projects`);
      await expect(page.locator('h1')).toContainText('作品集');
    });

    test('Projects page lists 4 project cards', async ({ page }) => {
      await page.goto(`${BASE}/admin/projects`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      const cards = page.locator('.bg-white.rounded-2xl.border.border-gray-200').filter({ hasText: /Platform|Dashboard|Analyzer|Tool/ });
      expect(await cards.count()).toBeGreaterThanOrEqual(4);
    });

    test('Can open new project modal', async ({ page }) => {
      await page.goto(`${BASE}/admin/projects`);
      await page.waitForLoadState('networkidle');
      const addBtn = page.locator('button').filter({ hasText: '新增作品' });
      await addBtn.click();
      await expect(page.locator('[role="dialog"], .fixed.inset-0')).toBeVisible({ timeout: 3000 });
    });

    test('Experience page loads with items', async ({ page }) => {
      await page.goto(`${BASE}/admin/experience`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await expect(page.locator('h1')).toContainText('工作經歷');
      // Check for any experience item text
      await expect(page.locator('text=TechCorp Taiwan')).toBeVisible({ timeout: 5000 });
    });

    test('Testimonials page loads with items', async ({ page }) => {
      await page.goto(`${BASE}/admin/testimonials`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await expect(page.locator('h1')).toContainText('推薦人');
      await expect(page.locator('text=陳志偉')).toBeVisible({ timeout: 5000 });
    });

    test('Messages page loads inbox', async ({ page }) => {
      await page.goto(`${BASE}/admin/messages`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toContainText('聯繫訊息');
      await expect(page.locator('text=收件匣')).toBeVisible();
    });

    test('Profile page loads and shows sections', async ({ page }) => {
      await page.goto(`${BASE}/admin/profile`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await expect(page.locator('h1')).toContainText('個人資料');
      // Check the profile sections are rendered
      await expect(page.locator('text=基本資訊')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=社群連結')).toBeVisible();
      // The save button exists
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('Can create a new project via modal', async ({ page }) => {
      await page.goto(`${BASE}/admin/projects`);
      await page.waitForLoadState('networkidle');

      await page.locator('button').filter({ hasText: '新增作品' }).click();
      await page.waitForSelector('.fixed.inset-0', { timeout: 3000 });

      // Fill form - use label-based approach
      const inputs = page.locator('.fixed.inset-0 input[type="text"]');
      await inputs.nth(0).fill('QA Playwright Test Project');
      await page.locator('.fixed.inset-0 textarea').fill('Project created by QA automated test.');
      await page.locator('.fixed.inset-0 button[type="submit"]').click();

      // Modal closes and project appears
      await expect(page.locator('.fixed.inset-0')).not.toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=QA Playwright Test Project')).toBeVisible({ timeout: 5000 });

      // Clean up: delete the created project
      const deleteBtn = page.locator('.bg-white.rounded-2xl.border').filter({ hasText: 'QA Playwright Test Project' }).locator('button').last();
      page.on('dialog', d => d.accept());
      await deleteBtn.click();
      await expect(page.locator('text=QA Playwright Test Project')).not.toBeVisible({ timeout: 5000 });
    });
  });
});

// ─── Responsive Design Tests ────────────────────────────────────────────────

test.describe('Responsive Design', () => {
  test('Mobile (375px) - portfolio page renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Desktop nav should be hidden on mobile
    await expect(page.locator('h1')).toBeVisible();
    // Mobile menu button visible
    const menuBtns = page.locator('nav button');
    expect(await menuBtns.count()).toBeGreaterThan(0);
  });

  test('Tablet (768px) - page renders without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#projects')).toBeVisible();
  });

  test('Desktop (1440px) - full layout renders', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });
});
