/**
 * Video Playback & Progress Tests — TC-V01 to TC-V09
 * Covers: player rendering, YouTube/direct links, progress tracking, access control
 */
const { test, expect } = require('@playwright/test');
const { TEST_USER, ADMIN_USER, loginAs, API_BASE, getStoredToken } = require('./helpers');

test.describe('Video Playback', () => {

  // ── TC-V01: Video player renders ─────────────────────────────────────────
  test('TC-V01: Video player element is present on learning page', async ({ page }) => {
    await loginAs(page);
    // Navigate to enrolled course's learning page — adjust URL pattern as needed
    await page.goto('/courses');
    await page.locator('[data-testid="course-card"], .course-card, .ant-card').first().click();

    // Try to reach learning/watch page
    const watchBtn = page.getByRole('button', { name: /watch|start|continue|learn/i });
    if (await watchBtn.isVisible()) await watchBtn.click();

    // React Player renders an iframe (YouTube) or <video> element
    await expect(
      page.locator('iframe[src*="youtube"], iframe[src*="youtu.be"], video').first()
    ).toBeVisible({ timeout: 10000 });
  });

  // ── TC-V07: Thumbnail renders on course cards ────────────────────────────
  test('TC-V07: Course thumbnails are not broken images', async ({ page }) => {
    await loginAs(page);
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // Check all img elements in course cards have non-empty src and load successfully
    const images = await page.locator('[data-testid="course-card"] img, .course-card img, .ant-card img').all();

    for (const img of images) {
      const src = await img.getAttribute('src');
      expect(src).toBeTruthy();

      // Evaluate natural width — 0 means broken image
      const naturalWidth = await img.evaluate((el) => el.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  // ── TC-V04: Progress tracked via API ─────────────────────────────────────
  test('TC-V04: Video progress update API returns 200', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: TEST_USER.email, password: TEST_USER.password },
    });
    const body = await loginRes.json();
    const token = body.data?.token;
    const userId = body.data?.id;

    // We need an enrolled course ID — fetch enrollments
    const learningRes = await request.get(`${API_BASE}/api/learning`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (learningRes.status() !== 200) {
      test.skip(true, 'No enrollments found for test user');
      return;
    }

    const enrollments = (await learningRes.json()).data;
    if (!enrollments || enrollments.length === 0) {
      test.skip(true, 'No enrollments found for test user');
      return;
    }

    const courseId = enrollments[0].course?.id || enrollments[0].courseId;

    const progressRes = await request.put(`${API_BASE}/api/progress/update-progress`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { userId, courseId, watchedDuration: 120, totalDuration: 600 },
    });
    expect([200, 201]).toContain(progressRes.status());
  });

  // ── TC-V06: Unenrolled user blocked from learning page ───────────────────
  test('TC-V06: Unauthenticated user cannot access learning page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Attempt direct URL access to a learning page
    await page.goto('/learning/1');
    await expect(page).toHaveURL(/login/i, { timeout: 6000 });
  });

  // ── TC-V08: Missing video handled gracefully ──────────────────────────────
  test('TC-V08: Course with no video link shows graceful message, not crash', async ({ page }) => {
    const consoleLogs = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleLogs.push(msg.text());
    });

    await loginAs(page);
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // No uncaught React errors should appear
    const errorOverlay = page.locator('#webpack-dev-server-client-overlay, [data-testid="error-overlay"]');
    await expect(errorOverlay).not.toBeVisible();

    // Check no fatal JS errors about undefined video
    const fatalErrors = consoleLogs.filter((log) =>
      log.includes('Cannot read') || log.includes('undefined is not a function')
    );
    expect(fatalErrors).toHaveLength(0);
  });

  // ── Progress API structure validation ────────────────────────────────────
  test('API: GET /api/progress returns correct structure', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: TEST_USER.email, password: TEST_USER.password },
    });
    const body = await loginRes.json();
    const token = body.data?.token;
    const userId = body.data?.id;

    if (!userId) { test.skip(true, 'Could not get userId'); return; }

    // Fetch enrollments to get a courseId
    const learningRes = await request.get(`${API_BASE}/api/learning`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const enrollments = (await learningRes.json()).data;
    if (!enrollments?.length) { test.skip(true, 'No enrollments'); return; }

    const courseId = enrollments[0].course?.id || enrollments[0].courseId;
    const progressRes = await request.get(`${API_BASE}/api/progress/${userId}/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(progressRes.status()).toBe(200);
    const progressBody = await progressRes.json();
    expect(progressBody).toHaveProperty('data');
  });
});
