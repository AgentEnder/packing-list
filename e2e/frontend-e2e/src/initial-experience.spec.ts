import { test, expect } from '@playwright/test';

// Only run in Chromium for now
test.describe('Initial App Experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows welcome modal on first visit', async ({ page }) => {
    await expect(page.locator('.modal-box')).toBeVisible();
    await expect(page.locator('.modal-box')).toContainText(
      'Welcome to Smart Packing List!'
    );
    await expect(
      page.getByRole('button', { name: 'Load Demo Trip' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Start Fresh' })
    ).toBeVisible();
  });

  test('demo banner workflow', async ({ page }) => {
    // Load demo data
    await page.getByRole('button', { name: 'Load Demo Trip' }).click();

    // Verify demo banner
    const demoBanner = page.getByText("You're currently using demo data");
    await expect(demoBanner).toBeVisible();

    // Clear demo data
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(demoBanner).not.toBeVisible();

    // Verify we're back to empty state
    await expect(
      page.getByText('Create the perfect packing list')
    ).toBeVisible();
  });

  test('persists demo choice in session storage', async ({ page }) => {
    await page.getByRole('button', { name: 'Load Demo Trip' }).click();

    // Refresh page
    await page.reload();

    // Verify demo modal doesn't show again
    await expect(page.locator('.modal-box')).not.toBeVisible();
    await expect(
      page.getByText("You're currently using demo data")
    ).toBeVisible();
  });

  test('help messages can be managed', async ({ page }) => {
    // Load demo data to get a populated UI
    await page.getByRole('button', { name: 'Load Demo Trip' }).click();

    // Navigate to settings
    await page.getByRole('link', { name: 'Settings' }).click();

    // Hide all help messages
    await page.getByRole('button', { name: 'Hide All Help' }).click();

    // Verify help messages are hidden
    await page.goto('/');
    await expect(page.getByText('How It Works')).not.toBeVisible();

    // Reset help messages
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Reset Help Messages' }).click();

    // Verify help messages are visible again
    await page.goto('/');
    await expect(page.getByText('How It Works')).toBeVisible();
  });

  test('navigation menu works correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Fresh' }).click();

    // Test all main navigation links
    const navLinks = [
      { name: 'Overview', expectedTitle: 'Smart Packing List' },
      { name: 'People', expectedTitle: 'People on this Trip' },
      { name: 'Days', expectedTitle: 'Trip Schedule' },
      { name: 'Default Items', expectedTitle: 'Default Packing Rules' },
      { name: 'Settings', expectedTitle: 'Settings' },
    ];

    for (const link of navLinks) {
      await page.getByRole('link', { name: link.name }).click();
      await expect(page.locator('h1')).toContainText(link.expectedTitle);
    }
  });
});
