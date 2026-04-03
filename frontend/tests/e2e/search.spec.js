/**
 * Search Functionality Tests — TC-S01 to TC-S07
 */
const { test, expect } = require('@playwright/test');
const { loginAs } = require('./helpers');

test.describe('Search Functionality', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await page.goto('/courses');
  });

  // ── TC-S01: Search with matching keyword ─────────────────────────────────
  test('TC-S01: Search returns matching courses', async ({ page }) => {
    // Get the name of the first visible course to use as search term
    const firstCourseName = await page
      .locator('[data-testid="course-card"] h3, .ant-card-meta-title, .course-title')
      .first()
      .textContent();

    const keyword = firstCourseName?.split(' ')[0] ?? 'course';

    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    await searchInput.fill(keyword);
    await searchInput.press('Enter');

    await page.waitForTimeout(800);

    // At least one result should be visible
    const cards = page.locator('[data-testid="course-card"], .course-card, .ant-card');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  // ── TC-S02: Case-insensitive search ──────────────────────────────────────
  test('TC-S02: Search is case-insensitive', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();

    await searchInput.fill('python');
    await searchInput.press('Enter');
    await page.waitForTimeout(600);
    const lowerCount = await page.locator('[data-testid="course-card"], .course-card, .ant-card').count();

    await searchInput.fill('PYTHON');
    await searchInput.press('Enter');
    await page.waitForTimeout(600);
    const upperCount = await page.locator('[data-testid="course-card"], .course-card, .ant-card').count();

    expect(lowerCount).toBe(upperCount);
  });

  // ── TC-S03: Search with no results ───────────────────────────────────────
  test('TC-S03: Search with no results shows empty state message', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    await searchInput.fill('xyzthiscoursedoesnotexist12345');
    await searchInput.press('Enter');

    await page.waitForTimeout(800);

    // Either no cards or an explicit empty state message
    const cardCount = await page.locator('[data-testid="course-card"], .course-card, .ant-card').count();
    const emptyMessage = await page.locator('text=/no result|no course|not found/i').isVisible();

    expect(cardCount === 0 || emptyMessage).toBe(true);
  });

  // ── TC-S04: Empty search shows all courses ────────────────────────────────
  test('TC-S04: Clearing search restores full course list', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();

    // Get initial count
    const initialCount = await page.locator('[data-testid="course-card"], .course-card, .ant-card').count();

    // Type then clear
    await searchInput.fill('something');
    await searchInput.press('Enter');
    await page.waitForTimeout(600);

    await searchInput.clear();
    await searchInput.press('Enter');
    await page.waitForTimeout(600);

    const restoredCount = await page.locator('[data-testid="course-card"], .course-card, .ant-card').count();
    expect(restoredCount).toBeGreaterThanOrEqual(initialCount);
  });

  // ── TC-S05: XSS in search input ──────────────────────────────────────────
  test('TC-S05: XSS payload in search bar does not execute', async ({ page }) => {
    const alerts = [];
    page.on('dialog', (d) => { alerts.push(d.message()); d.dismiss(); });

    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    await searchInput.fill('<script>alert("xss")</script>');
    await searchInput.press('Enter');

    await page.waitForTimeout(1000);
    expect(alerts).toHaveLength(0);
  });

  // ── TC-S06: Very long search string does not crash ────────────────────────
  test('TC-S06: 500-char search string handled without crash', async ({ page }) => {
    const longString = 'a'.repeat(500);
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    await searchInput.fill(longString);
    await searchInput.press('Enter');

    // Page should still be functional — no error overlay
    const errorOverlay = page.locator('#webpack-dev-server-client-overlay');
    await expect(errorOverlay).not.toBeVisible();
    await expect(page).toHaveURL(/courses/i);
  });

  // ── TC-S07: Search bar visible ───────────────────────────────────────────
  test('TC-S07: Search bar is visible on courses page', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    await expect(searchInput).toBeVisible();
  });
});
