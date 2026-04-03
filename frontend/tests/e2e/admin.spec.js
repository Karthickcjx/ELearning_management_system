/**
 * Admin Role-Based Access Tests — TC-ADM01 to TC-ADM10
 */
const { test, expect } = require('@playwright/test');
const { TEST_USER, ADMIN_USER, loginAs, API_BASE } = require('./helpers');

test.describe('Admin Features & Role-Based Access', () => {

  // ── TC-ADM01: Admin accesses admin dashboard ──────────────────────────────
  test('TC-ADM01: Admin can access the admin dashboard', async ({ page }) => {
    await loginAs(page, ADMIN_USER);
    await page.goto('/admin');
    // Should not redirect away
    await expect(page).toHaveURL(/admin/i);
    // Some dashboard content should load
    await expect(page.locator('h1, h2, [data-testid="admin-dashboard"]').first()).toBeVisible({ timeout: 8000 });
  });

  // ── TC-ADM02: Regular user blocked from admin dashboard ───────────────────
  test('TC-ADM02: Regular user cannot access admin dashboard', async ({ page }) => {
    await loginAs(page, TEST_USER);
    await page.goto('/admin');

    // Should be redirected away from /admin
    await page.waitForTimeout(1500);
    const currentUrl = page.url();
    const isOnAdmin = currentUrl.includes('/admin') && !currentUrl.includes('/user');
    expect(isOnAdmin).toBe(false);
  });

  // ── TC-ADM03: Admin gets all users ───────────────────────────────────────
  test('TC-ADM03: Admin can retrieve all users via API', async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: ADMIN_USER.email, password: ADMIN_USER.password },
    });
    const adminToken = (await loginRes.json()).data?.token;

    const res = await request.get(`${API_BASE}/api/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  // ── TC-ADM06: Admin creates announcement ──────────────────────────────────
  test('TC-ADM06/07: Admin creates and publishes an announcement', async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: ADMIN_USER.email, password: ADMIN_USER.password },
    });
    const adminToken = (await loginRes.json()).data?.token;
    const headers = { Authorization: `Bearer ${adminToken}` };

    // Create
    const createRes = await request.post(`${API_BASE}/api/announcements`, {
      headers,
      data: { title: 'QA Test Announcement', content: 'This is a test announcement from QA automation' },
    });
    expect(createRes.status()).toBe(200);
    const announcement = (await createRes.json()).data;
    expect(announcement).toHaveProperty('id');
    const announcementId = announcement.id;

    // Toggle publish
    const toggleRes = await request.put(`${API_BASE}/api/announcements/${announcementId}/toggle-publish`, { headers });
    expect(toggleRes.status()).toBe(200);

    // Verify visible in published list
    const listRes = await request.get(`${API_BASE}/api/announcements/published`);
    const published = (await listRes.json()).data;
    const found = published?.some((a) => a.id === announcementId);
    expect(found).toBe(true);

    // Cleanup
    await request.delete(`${API_BASE}/api/announcements/${announcementId}`, { headers });
  });

  // ── TC-ADM08: Admin adds quiz question ────────────────────────────────────
  test('TC-ADM08: Admin can add a question to a course', async ({ request }) => {
    const adminLoginRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: ADMIN_USER.email, password: ADMIN_USER.password },
    });
    const adminToken = (await adminLoginRes.json()).data?.token;
    const headers = { Authorization: `Bearer ${adminToken}` };

    // Get a course ID
    const coursesRes = await request.get(`${API_BASE}/api/courses`, { headers });
    const courses = (await coursesRes.json()).data;
    if (!courses?.length) { test.skip(true, 'No courses available'); return; }
    const courseId = courses[0].id;

    const questionRes = await request.post(`${API_BASE}/api/questions`, {
      headers,
      data: {
        courseId,
        question: 'What is the capital of QA Land?',
        optionA: 'Bug City',
        optionB: 'Test Town',
        optionC: 'Assert Avenue',
        optionD: 'Mock Mountain',
        correctAnswer: 'B',
      },
    });
    expect(questionRes.status()).toBe(200);
    const q = (await questionRes.json()).data;
    expect(q).toHaveProperty('id');

    // Cleanup
    await request.delete(`${API_BASE}/api/questions/${q.id}`, { headers });
  });

  // ── TC-ADM09: User cannot delete another user ─────────────────────────────
  test('TC-ADM09: Regular user gets 403 when deleting another user', async ({ request }) => {
    // Login as normal user
    const userLoginRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: TEST_USER.email, password: TEST_USER.password },
    });
    const userToken = (await userLoginRes.json()).data?.token;

    // Login as admin to get a valid user ID that is NOT the test user
    const adminLoginRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: ADMIN_USER.email, password: ADMIN_USER.password },
    });
    const adminToken = (await adminLoginRes.json()).data?.token;
    const allUsersRes = await request.get(`${API_BASE}/api/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const users = (await allUsersRes.json()).data;
    const otherUser = users?.find((u) => u.email !== TEST_USER.email && u.email !== ADMIN_USER.email);
    if (!otherUser) { test.skip(true, 'No third user found to test against'); return; }

    const deleteRes = await request.delete(`${API_BASE}/api/users/${otherUser.id}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(deleteRes.status()).toBe(403);
  });

  // ── TC-ADM05: Admin broadcasts message ────────────────────────────────────
  test('TC-ADM05: Admin can broadcast a message to all users', async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: ADMIN_USER.email, password: ADMIN_USER.password },
    });
    const adminToken = (await loginRes.json()).data?.token;

    const broadcastRes = await request.post(`${API_BASE}/api/messages/broadcast`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { content: 'QA Broadcast Test Message — please ignore' },
    });
    expect(broadcastRes.status()).toBe(200);
  });
});
