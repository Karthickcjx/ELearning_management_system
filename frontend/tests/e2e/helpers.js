/**
 * Shared helpers for Playwright E2E tests.
 * API_BASE points to the Spring Boot backend.
 */

const API_BASE = 'http://localhost:8081';

const TEST_USER = {
  email: 'testuser_qa@example.com',
  password: 'TestPass@123',
  name: 'QA Test User',
};

const ADMIN_USER = {
  email: 'admin@gmail.com',
  password: 'admin123',
};

/**
 * Login via API and inject the JWT into localStorage so tests
 * don't waste time going through the login UI every time.
 */
async function loginAs(page, credentials = TEST_USER) {
  const response = await page.request.post(`${API_BASE}/api/auth/login`, {
    data: { email: credentials.email, password: credentials.password },
  });
  const body = await response.json();
  const token = body.data?.token;
  if (!token) throw new Error(`Login failed for ${credentials.email}: ${JSON.stringify(body)}`);

  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('token', t), token);
  return token;
}

/**
 * Returns an Axios-style authenticated fetch helper for direct API assertions.
 */
async function apiGet(page, path) {
  return page.request.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${await getStoredToken(page)}` },
  });
}

async function getStoredToken(page) {
  return page.evaluate(() => localStorage.getItem('token'));
}

module.exports = { API_BASE, TEST_USER, ADMIN_USER, loginAs, apiGet, getStoredToken };
