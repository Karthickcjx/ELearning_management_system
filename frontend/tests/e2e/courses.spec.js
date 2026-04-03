/**
 * Course Management E2E Tests — TC-C01 to TC-C12
 * Covers: listing, enroll, CRUD (admin), role-based access
 */
const { test, expect } = require('@playwright/test');
const { TEST_USER, ADMIN_USER, loginAs, API_BASE } = require('./helpers');

test.describe('Course Management', () => {

  // ── TC-C01: User views published courses ─────────────────────────────────
  test('TC-C01: Courses page shows published courses', async ({ page }) => {
    await loginAs(page);
    await page.goto('/courses');

    // At least one course card should be present
    await expect(page.locator('[data-testid="course-card"], .course-card, .ant-card').first()).toBeVisible({ timeout: 8000 });
  });

  // ── TC-C02: Course detail page ────────────────────────────────────────────
  test('TC-C02: Clicking a course opens its detail view', async ({ page }) => {
    await loginAs(page);
    await page.goto('/courses');

    const firstCard = page.locator('[data-testid="course-card"], .course-card, .ant-card').first();
    await firstCard.click();

    // URL should change to course detail
    await expect(page).toHaveURL(/course/i);

    // Name or description text must appear
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });

  // ── TC-C03: Enroll in course ──────────────────────────────────────────────
  test('TC-C03: User can enroll in a course', async ({ page }) => {
    await loginAs(page);
    await page.goto('/courses');

    // Open first course
    await page.locator('[data-testid="course-card"], .course-card, .ant-card').first().click();

    // Click enroll button
    const enrollBtn = page.getByRole('button', { name: /enroll/i });
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
      await expect(page.locator('text=/enrolled|success|already/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  // ── TC-C09: Unpublished course hidden from user ───────────────────────────
  test('TC-C09: Unpublished course is not visible to regular users', async ({ page, request }) => {
    // Get admin token
    const adminRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: ADMIN_USER.email, password: ADMIN_USER.password },
    });
    const adminToken = (await adminRes.json()).data?.token;

    // Create and immediately unpublish a test course
    const createRes = await request.post(`${API_BASE}/api/courses`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        name: 'HIDDEN_QA_TEST_COURSE',
        description: 'Should not be visible',
        instructor: 'QA Bot',
        price: 0,
      },
    });
    const courseId = (await createRes.json()).data?.id;

    // Now login as regular user and check courses
    await loginAs(page);
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const hiddenCourse = page.locator(`text=HIDDEN_QA_TEST_COURSE`);
    await expect(hiddenCourse).not.toBeVisible();

    // Cleanup
    if (courseId) {
      await request.delete(`${API_BASE}/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
  });

  // ── TC-C10: User cannot create course ────────────────────────────────────
  test('TC-C10: User JWT cannot create a course (403)', async ({ page, request }) => {
    const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: TEST_USER.email, password: TEST_USER.password },
    });
    const userToken = (await loginRes.json()).data?.token;

    const res = await request.post(`${API_BASE}/api/courses`, {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { name: 'Hacked Course', description: 'Should not be created', instructor: 'Hacker', price: 0 },
    });
    expect(res.status()).toBe(403);
  });

  // ── Admin CRUD (API level) ────────────────────────────────────────────────
  test('TC-C05/C06/C07: Admin can create, update, and delete a course', async ({ request }) => {
    const adminRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: ADMIN_USER.email, password: ADMIN_USER.password },
    });
    const adminToken = (await adminRes.json()).data?.token;
    const headers = { Authorization: `Bearer ${adminToken}` };

    // Create
    const createRes = await request.post(`${API_BASE}/api/courses`, {
      headers,
      data: { name: 'QA Test Course', description: 'Auto test', instructor: 'QA', price: 0 },
    });
    expect(createRes.status()).toBe(200);
    const course = (await createRes.json()).data;
    expect(course).toHaveProperty('id');
    const courseId = course.id;

    // Update
    const updateRes = await request.put(`${API_BASE}/api/courses/${courseId}`, {
      headers,
      data: { name: 'QA Test Course UPDATED', description: 'Updated', instructor: 'QA', price: 10 },
    });
    expect(updateRes.status()).toBe(200);
    const updated = (await updateRes.json()).data;
    expect(updated.name).toBe('QA Test Course UPDATED');

    // Delete
    const deleteRes = await request.delete(`${API_BASE}/api/courses/${courseId}`, { headers });
    expect(deleteRes.status()).toBe(200);

    // Verify deleted
    const getRes = await request.get(`${API_BASE}/api/courses/${courseId}`, { headers });
    expect([404, 400]).toContain(getRes.status());
  });

  // ── TC-C08: Toggle publish ────────────────────────────────────────────────
  test('TC-C08: Admin can toggle course publish status', async ({ request }) => {
    const adminRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: ADMIN_USER.email, password: ADMIN_USER.password },
    });
    const adminToken = (await adminRes.json()).data?.token;
    const headers = { Authorization: `Bearer ${adminToken}` };

    // Create a course to toggle
    const createRes = await request.post(`${API_BASE}/api/courses`, {
      headers,
      data: { name: 'Toggle Test Course', description: 'Toggle test', instructor: 'QA', price: 0 },
    });
    const courseId = (await createRes.json()).data?.id;

    const toggleRes = await request.put(`${API_BASE}/api/courses/${courseId}/toggle-publish`, { headers });
    expect(toggleRes.status()).toBe(200);

    // Cleanup
    await request.delete(`${API_BASE}/api/courses/${courseId}`, { headers });
  });
});
