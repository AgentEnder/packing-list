import { test, expect, Page } from '@playwright/test';
import { setupTestSession } from './utils.js';
import { TripManager } from './page-objects/trip-manager';

test.describe('Offline Hydration', () => {
  let tripManager: TripManager;

  test.beforeEach(async ({ page, context }) => {
    await setupTestSession(page, context, 'fresh');
    tripManager = new TripManager(page);
  });

  test('should persist trip across reload', async ({ page }) => {
    // Create the trip and wait for it to be saved
    await tripManager.createFirstTrip({
      template: 'business',
      title: 'Persistent Trip',
      skipDates: true,
    });

    // Now reload and check persistence
    await page.reload();

    const tripSelectorAfter = page
      .locator('[data-testid*="trip-selector"]:visible')
      .first();

    // Wait for the trip selector to be present and contain text
    await expect(tripSelectorAfter).toBeVisible({ timeout: 5000 });

    const afterText = await tripSelectorAfter
      .textContent()
      .catch(() => 'Not found');

    // Final verification - trip should be selected and functional
    await tripManager.expectTripSelected('Persistent Trip');
  });
});
