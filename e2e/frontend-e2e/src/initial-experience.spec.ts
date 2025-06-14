import { test, expect } from '@playwright/test';
import { SettingsPage } from './page-objects/SettingsPage';

// Only run in Chromium for now
test.describe('Initial App Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Don't use setupTestSession here - we want to test the raw initial experience
    await page.goto('/');
  });

  test('shows no trip selected state on first visit', async ({ page }) => {
    await expect(
      page.getByText('Welcome to Smart Packing List!')
    ).toBeVisible();
    await expect(
      page.getByText(
        'Get started by selecting an existing trip, creating a new one, or trying our demo'
      )
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Try Demo Trip' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'View My Trips' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Create New Trip' })
    ).toBeVisible();
  });

  test('demo trip workflow', async ({ page }) => {
    // Load demo data via the new button
    await page.getByRole('button', { name: 'Try Demo Trip' }).click();

    // Verify demo banner appears with more flexible selector
    const demoBanner = page.getByText("You're currently using demo data");
    await expect(demoBanner).toBeVisible({ timeout: 10000 });

    // Verify we can see actual trip content (these might not always be visible)
    const howItWorksVisible = await page
      .getByText('How It Works')
      .isVisible()
      .catch(() => false);
    const statusVisible = await page
      .getByText('Current Trip Status')
      .isVisible()
      .catch(() => false);

    // At least one should be visible, or we should see demo content
    if (!howItWorksVisible && !statusVisible) {
      // Alternative: Check if we see the demo trip title instead
      await expect(page.getByText('Demo Trip: Houston & Miami')).toBeVisible({
        timeout: 5000,
      });
    }

    // Clear demo data
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(demoBanner).not.toBeVisible();

    // Check for either no trip text or verify we're on home page
    const welcomeText = page.getByText('Welcome to Smart Packing List!');
    const noTripText = page.getByText('No Trip Selected');

    // Check if either welcome text or no trip text is visible (depending on which page we're on)
    const welcomeVisible = await welcomeText.isVisible().catch(() => false);
    const noTripVisible = await noTripText.isVisible().catch(() => false);

    if (!welcomeVisible && !noTripVisible) {
      // Navigate to home page to get the welcome state
      await page.getByRole('link', { name: 'Overview' }).click();
      await expect(welcomeText).toBeVisible({ timeout: 5000 });
    } else {
      // One of them should be visible
      expect(welcomeVisible || noTripVisible).toBe(true);
    }
  });

  test('help messages can be managed', async ({ page }) => {
    // Demo messages don't show up if there is no trip data, we'll check with
    // the demo trip data.
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.loadDemoData();

    // Hide all help messages using the page object method
    await settingsPage.hideAllHelp();

    // Verify help messages are hidden
    await page.getByRole('link', { name: 'Overview' }).click();
    await expect(page.getByText('How It Works')).not.toBeVisible();

    // Reset help messages using the page object method
    await page.getByRole('link', { name: 'Settings' }).click();
    await settingsPage.resetHelpMessages();

    // Verify help messages are visible again
    await page.getByRole('link', { name: 'Overview' }).click();
    await expect(page.getByText('How It Works')).toBeVisible();
  });

  test('navigation menu shows no trip selected states', async ({ page }) => {
    // Start fresh - don't load demo data

    // Test all main navigation links show appropriate no-trip states
    const navTestCases = [
      {
        name: 'Overview',
        expectedTitle: 'Smart Packing List',
        expectedNoTripText: 'Welcome to Smart Packing List!',
      },
      {
        name: 'People',
        expectedTitle: 'People on this Trip',
        expectedNoTripText: 'No Trip Selected',
      },
      {
        name: 'Days',
        expectedTitle: 'Trip Days & Itinerary',
        expectedNoTripText: 'No Trip Selected',
      },
      {
        name: 'Default Items',
        expectedTitle: 'Packing Rules',
        expectedNoTripText: 'No Trip Selected',
      },
    ];

    for (const testCase of navTestCases) {
      await page.getByRole('link', { name: testCase.name }).click();
      await expect(page.locator('h1')).toContainText(testCase.expectedTitle);
      await expect(page.getByText(testCase.expectedNoTripText)).toBeVisible();
    }

    // Settings should work normally
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page.locator('h1')).toContainText('Settings');
    // Settings page doesn't have no-trip state
  });

  test('can create new trip from no trip selected state', async ({ page }) => {
    // Wait for no trip state to appear
    await expect(page.getByText('Welcome to Smart Packing List!')).toBeVisible({
      timeout: 10000,
    });

    // Click create new trip
    await page.getByRole('link', { name: 'Create New Trip' }).click();

    // Should navigate to trip creation page
    await page.waitForURL('**/trips/new', { timeout: 10000 });
    expect(page.url()).toContain('/trips/new');
  });

  test('can view trips from no trip selected state', async ({ page }) => {
    // Wait for no trip state to appear
    await expect(page.getByText('Welcome to Smart Packing List!')).toBeVisible({
      timeout: 10000,
    });

    // Click view my trips
    await page.getByRole('link', { name: 'View My Trips' }).click();

    // Should navigate to trips page
    await page.waitForURL('**/trips', { timeout: 10000 });
    expect(page.url()).toContain('/trips');
  });
});
