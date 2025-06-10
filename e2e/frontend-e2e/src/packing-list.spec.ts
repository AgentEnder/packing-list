import { test, expect } from '@playwright/test';
import { setupTestSession } from './utils.js';
import { PackingListPage } from './page-objects/PackingListPage.js';
import { TripManager } from './page-objects/trip-manager';

test.describe('Packing List View', () => {
  let packingListPage: PackingListPage;
  let tripManager: TripManager;

  test.describe('No Trip Selected State', () => {
    test.beforeEach(async ({ page, context }) => {
      await setupTestSession(page, context, 'fresh');
      packingListPage = new PackingListPage(page);
      tripManager = new TripManager(page);
      await packingListPage.goto();
    });

    test('should show no trip selected state when no trip is selected', async () => {
      await tripManager.expectNoTripSelected();
    });

    test('should show demo option and navigation links', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: 'Try Demo Trip' })
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'View My Trips' })
      ).toBeVisible();
    });

    test('should load demo when demo button is clicked', async ({ page }) => {
      await page.getByRole('button', { name: 'Try Demo Trip' }).click();

      // Should now see demo data and actual packing list content
      await expect(
        page.getByText("You're currently using demo data")
      ).toBeVisible();
      await expect(page.getByTestId('no-trip-selected')).not.toBeVisible();
    });
  });

  test.describe('With Test Data', () => {
    test.beforeEach(async ({ page, context }) => {
      await setupTestSession(page, context, 'fresh');
      tripManager = new TripManager(page);

      // Create a trip first using TripManager
      await tripManager.createFirstTrip({
        template: 'business',
        title: 'Test Trip',
        skipDates: true,
      });

      packingListPage = new PackingListPage(page);
    });

    test('should navigate to packing list page', async () => {
      await packingListPage.goto();
      await expect(
        packingListPage.page
          .getByRole('heading', {
            name: 'Packing List',
            level: 1,
          })
          .first()
      ).toBeVisible();
    });

    test('should show empty state when no packing items exist', async () => {
      await packingListPage.goto();
      // With no people, days, or rules configured, should show empty state guidance
      await expect(packingListPage.isEmptyStateVisible()).resolves.toBe(true);
    });
  });

  test.describe('With Demo Data', () => {
    test.beforeEach(async ({ page, context }) => {
      // Use demo data for tests that specifically need rich data
      await setupTestSession(page, context, 'demo');
      packingListPage = new PackingListPage(page);
    });

    test('should have view mode controls visible with demo data', async () => {
      await packingListPage.goto();

      await expect(
        packingListPage.page.getByTestId('view-mode-by-day')
      ).toBeVisible();
      await expect(
        packingListPage.page.getByTestId('view-mode-by-person')
      ).toBeVisible();
    });

    test('should display packing content with demo data', async () => {
      await packingListPage.goto();

      const hasContent = await packingListPage.hasContent();
      expect(hasContent).toBe(true);
      expect(await packingListPage.getGroupCount()).toBeGreaterThan(0);
      expect(await packingListPage.getItemCount()).toBeGreaterThan(0);
    });

    test('should open pack dialog when pack button is clicked', async () => {
      await packingListPage.goto();

      const hasContent = await packingListPage.hasContent();
      expect(hasContent).toBe(true);

      const items = await packingListPage.getAllItems();
      if (items.length === 0) {
        throw new Error('No packing items found');
      }

      expect(items.length).toBeGreaterThan(0);

      const firstItem = items[0];

      // Make sure the pack button exists before clicking
      const packButton = packingListPage.page
        .getByTestId('pack-button')
        .first();
      await expect(packButton).toBeVisible({ timeout: 5000 });

      await firstItem.clickPackButton();

      const isModalVisible = await packingListPage.packItemsModal.isVisible();
      expect(isModalVisible).toBe(true);
    });
  });
});
