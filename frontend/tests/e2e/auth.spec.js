/**
 * Auth E2E Tests — TC-A01 to TC-A15
 * Covers: login, registration, logout, JWT handling, security
 */
const { test, expect } = require('@playwright/test');
const { TEST_USER, ADMIN_USER, loginAs, API_BASE } = require('./helpers');

test.describe('Authentication', () => {

  // ── TC-A01: Successful login ──────────────────────────────────────────────
  test('TC-A01: Login with valid credentials stores token and redirects', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill(TEST_USER.email);
    await page.getByPlaceholder(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /login/i }).click();

    // Should land on dashboard
    await expect(page).toHaveURL(/dashboard/i);

    // Token must be present in localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  // ── TC-A02: Invalid email format ──────────────────────────────────────────
  test('TC-A02: Login rejects invalid email format', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill('notanemail');
    await page.getByPlaceholder(/password/i).fill('anything');
    await page.getByRole('button', { name: /login/i }).click();

    // Expect inline validation or API error — should NOT navigate away
    await expect(page).toHaveURL(/login/i);
    const errorVisible = await page.locator('text=/invalid|email/i').isVisible();
    expect(errorVisible).toBe(true);
  });

  // ── TC-A03: Wrong password ────────────────────────────────────────────────
  test('TC-A03: Login with wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill(TEST_USER.email);
    await page.getByPlaceholder(/password/i).fill('WrongPassword!99');
    await page.getByRole('button', { name: /login/i }).click();

    await expect(page).toHaveURL(/login/i);
    await expect(page.locator('text=/invalid|incorrect|credentials/i').first()).toBeVisible();
  });

  // ── TC-A04: Empty form submission ─────────────────────────────────────────
  test('TC-A04: Login with empty fields shows validation errors', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /login/i }).click();

    // Both fields should show required error
    const errors = await page.locator('text=/required/i').count();
    expect(errors).toBeGreaterThanOrEqual(1);
    await expect(page).toHaveURL(/login/i);
  });

  // ── TC-A05: SQL injection attempt ────────────────────────────────────────
  test('TC-A05: SQL injection in email is rejected safely', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill("' OR 1=1 --");
    await page.getByPlaceholder(/password/i).fill("' OR 1=1 --");
    await page.getByRole('button', { name: /login/i }).click();

    // Must stay on login page; no SQL error leaked to UI
    await expect(page).toHaveURL(/login/i);
    const sqlErrorVisible = await page.locator('text=/sql|syntax error/i').isVisible();
    expect(sqlErrorVisible).toBe(false);
  });

  // ── TC-A06: XSS in email field ───────────────────────────────────────────
  test('TC-A06: XSS payload in email is sanitized', async ({ page }) => {
    const alerts = [];
    page.on('dialog', (d) => { alerts.push(d.message()); d.dismiss(); });

    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill('<script>alert("xss")</script>');
    await page.getByPlaceholder(/password/i).fill('test');
    await page.getByRole('button', { name: /login/i }).click();

    // No alert dialog should have fired
    expect(alerts).toHaveLength(0);
  });

  // ── TC-A13: Logout clears session ────────────────────────────────────────
  test('TC-A13: Logout removes token and redirects to login', async ({ page }) => {
    await loginAs(page);
    await page.goto('/dashboard');

    // Find and click logout (could be in a nav dropdown)
    await page.locator('[data-testid="logout-btn"], button:has-text("Logout"), a:has-text("Logout")').first().click();

    await expect(page).toHaveURL(/login/i);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  // ── TC-A14: Protected route redirect ─────────────────────────────────────
  test('TC-A14: Accessing /dashboard without token redirects to login', async ({ page }) => {
    // Ensure clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/i);
  });

  // ── TC-A15: Expired JWT handling ─────────────────────────────────────────
  test('TC-A15: Expired JWT triggers 401 and redirects to login', async ({ page }) => {
    await page.goto('/');
    // Inject a clearly expired token (any well-formed but old JWT)
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIiwiZXhwIjoxfQ.fake');
    });

    await page.goto('/dashboard');
    // App should detect 401 from any API call and redirect
    await expect(page).toHaveURL(/login/i, { timeout: 8000 });
  });

  // ── API-level auth tests (via page.request) ───────────────────────────────
  test('API: POST /api/auth/login returns token structure', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: TEST_USER.email, password: TEST_USER.password },
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('data.token');
    expect(body).toHaveProperty('data.email', TEST_USER.email);
    expect(body).toHaveProperty('data.role');
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('timestamp');
  });

  test('API: POST /api/auth/login with wrong creds returns 401', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: TEST_USER.email, password: 'wrongpassword' },
    });
    expect(res.status()).toBe(401);
  });

  test('API: Protected endpoint without token returns 401', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/users`);
    expect(res.status()).toBe(401);
  });
});
