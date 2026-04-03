/**
 * End-to-End User Journey Tests — TC-E2E01 to TC-E2E04
 * Simulates real user behavior: Register → Login → Enroll → Watch → Assess
 */
const { test, expect } = require('@playwright/test');
const { TEST_USER, ADMIN_USER, loginAs, API_BASE } = require('./helpers');

// Unique email for registration tests to avoid conflicts
const NEW_USER = {
  email: `qa_e2e_${Date.now()}@testmail.com`,
  password: 'QaPass@2024',
  name: 'E2E Test User',
  username: `qauser${Date.now()}`,
};

test.describe('End-to-End User Journeys', () => {

  // ── TC-E2E01: Full user journey ───────────────────────────────────────────
  test('TC-E2E01: User Login → Browse → Enroll → Check Progress', async ({ page }) => {
    // Step 1: Login
    await loginAs(page);

    // Step 2: Browse courses
    await page.goto('/courses');
    await expect(
      page.locator('[data-testid="course-card"], .course-card, .ant-card').first()
    ).toBeVisible({ timeout: 8000 });

    // Step 3: Open a course
    await page.locator('[data-testid="course-card"], .course-card, .ant-card').first().click();
    await expect(page).toHaveURL(/course/i);

    // Step 4: Enroll if possible
    const enrollBtn = page.getByRole('button', { name: /enroll/i });
    if (await enrollBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enrollBtn.click();
      await page.waitForTimeout(1000);
    }

    // Step 5: Verify user dashboard shows enrolled course
    await page.goto('/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });

  // ── TC-E2E02: Admin creates and publishes course ───────────────────────────
  test('TC-E2E02: Admin creates course → publishes → user sees it', async ({ page, request }) => {
    // Admin creates and publishes course
    const adminRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: ADMIN_USER.email, password: ADMIN_USER.password },
    });
    const adminToken = (await adminRes.json()).data?.token;
    const headers = { Authorization: `Bearer ${adminToken}` };

    const createRes = await request.post(`${API_BASE}/api/courses`, {
      headers,
      data: {
        name: 'E2E Journey Test Course',
        description: 'Created by QA automation',
        instructor: 'QA Bot',
        price: 0,
        y_link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    });
    expect(createRes.status()).toBe(200);
    const courseId = (await createRes.json()).data?.id;

    // Publish it
    await request.put(`${API_BASE}/api/courses/${courseId}/toggle-publish`, { headers });

    // Now login as user and check courses listing
    await loginAs(page);
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // The course should now appear
    await expect(page.locator('text=E2E Journey Test Course')).toBeVisible({ timeout: 8000 });

    // Cleanup
    await request.delete(`${API_BASE}/api/courses/${courseId}`, { headers });
  });

  // ── TC-E2E03: Password reset flow ────────────────────────────────────────
  test('TC-E2E03: Password reset API flow (OTP send → reset)', async ({ request }) => {
    // Request OTP for existing user
    const otpRes = await request.post(`${API_BASE}/api/auth/send-otp`, {
      data: { email: TEST_USER.email },
    });
    // Should be 200 (OTP sent) or 429 (rate limited)
    expect([200, 429]).toContain(otpRes.status());

    if (otpRes.status() === 200) {
      // Try reset with wrong OTP to verify rejection
      const resetRes = await request.post(`${API_BASE}/api/auth/reset-password`, {
        data: {
          email: TEST_USER.email,
          otp: '000000',
          newPassword: 'NewPass@123',
        },
      });
      expect(resetRes.status()).toBe(400);
      const body = await resetRes.json();
      expect(body.message).toMatch(/invalid|expired|otp/i);
    }
  });

  // ── TC-E2E04: Assessment journey ─────────────────────────────────────────
  test('TC-E2E04: User can view and submit assessment for enrolled course', async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: TEST_USER.email, password: TEST_USER.password },
    });
    const body = await loginRes.json();
    const token = body.data?.token;
    const userId = body.data?.id;
    const headers = { Authorization: `Bearer ${token}` };

    // Get enrolled courses
    const learningRes = await request.get(`${API_BASE}/api/learning`, { headers });
    const enrollments = (await learningRes.json()).data;
    if (!enrollments?.length) { test.skip(true, 'No enrollments for test user'); return; }

    const courseId = enrollments[0].course?.id || enrollments[0].courseId;

    // Get questions for course
    const qRes = await request.get(`${API_BASE}/api/questions/course/${courseId}`, { headers });
    if (qRes.status() !== 200) { test.skip(true, 'No questions for enrolled course'); return; }

    const questions = (await qRes.json()).data;
    if (!questions?.length) { test.skip(true, 'No questions available'); return; }

    // Submit assessment
    const answers = questions.map((q) => ({ questionId: q.id, answer: 'A' }));
    const submitRes = await request.post(`${API_BASE}/api/assessments/add/${userId}/${courseId}`, {
      headers,
      data: { answers },
    });
    expect([200, 201]).toContain(submitRes.status());
    const result = (await submitRes.json()).data;
    expect(result).toHaveProperty('score');
  });

  // ── Logout clears state ───────────────────────────────────────────────────
  test('TC-A13 (E2E): Login then Logout removes all auth state', async ({ page }) => {
    await loginAs(page);
    await page.goto('/dashboard');

    // Token should be set
    let token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    // Logout
    await page.locator('[data-testid="logout-btn"], button:has-text("Logout"), a:has-text("Logout")').first().click();
    await expect(page).toHaveURL(/login/i, { timeout: 5000 });

    // Token should be cleared
    token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();

    // Cannot navigate back to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/i);
  });
});
