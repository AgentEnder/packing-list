import { test } from '@playwright/test';
import { setupTestSession } from './utils.js';
import { TripManager } from './page-objects/trip-manager';

test.describe('Offline Hydration', () => {
  let tripManager: TripManager;

  test.beforeEach(async ({ page, context }) => {
    await setupTestSession(page, context, 'fresh');
    tripManager = new TripManager(page);
  });

  test('should persist trip across reload', async ({ page }) => {
    await tripManager.createFirstTrip({
      template: 'business',
      title: 'Persistent Trip',
      skipDates: true,
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await tripManager.expectTripSelected('Persistent Trip');
  });
});
