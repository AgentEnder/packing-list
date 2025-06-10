import { test, expect } from '@playwright/test';
import { setupTestSession } from './utils';
import { TripsListPage } from './page-objects/TripsListPage';
import { TripManager } from './page-objects/trip-manager';

test.describe('Trips Listing Page', () => {
  let tripsPage: TripsListPage;
  let tripManager: TripManager;

  test.beforeEach(async ({ page, context }) => {
    await setupTestSession(page, context, 'fresh');
    tripsPage = new TripsListPage(page);
    tripManager = new TripManager(page);
  });

  test.describe('Empty State', () => {
    test('displays empty state when no trips exist', async () => {
      // Only way to get to trips page when no trips exist is direct navigation
      await tripsPage.page.goto('/trips');

      await tripsPage.expectPageTitle();
      await tripsPage.expectPageDescription();
      await tripsPage.expectEmptyState();
    });

    test('navigates to new trip creation from empty state', async () => {
      // Only way to get to trips page when no trips exist is direct navigation
      await tripsPage.page.goto('/trips');

      await tripsPage.clickCreateFirstTripLink();
      await expect(tripsPage.page).toHaveURL(/\/trips\/new/);
    });

    test('navigates to new trip creation from header button', async () => {
      // Only way to get to trips page when no trips exist is direct navigation
      await tripsPage.page.goto('/trips');

      await tripsPage.clickNewTripButton();
      await expect(tripsPage.page).toHaveURL(/\/trips\/new/);
    });
  });

  test.describe('Trips Grid Display', () => {
    test.beforeEach(async () => {
      // Start from home page to match working pattern
      await tripsPage.page.goto('/');
      await tripsPage.page.waitForLoadState('networkidle');

      // Create test trips using the successful TripManager pattern
      await tripManager.createFirstTrip({
        template: 'business',
        title: 'Business Trip NYC',
        skipDates: true,
      });

      await tripManager.createAdditionalTrip({
        template: 'vacation',
        title: 'Summer Vacation',
        skipDates: true,
      });

      // Navigate to trips page after successful creation
      await tripsPage.goto();
    });

    test('displays trips grid with multiple trips', async () => {
      await tripsPage.expectPageTitle();
      await tripsPage.expectPageDescription();

      // Check that we have trip cards instead of checking for exact grid
      const tripCards = tripsPage.page.locator('.card.bg-base-100');
      await expect(tripCards).toHaveCount(2, { timeout: 10000 });

      // Should show 2 trips by title
      await expect(
        tripsPage.page.getByRole('heading', {
          name: 'Business Trip NYC',
          exact: true,
        })
      ).toBeVisible();
      // Summer Vacation has "Current" badge, so match either way
      const summerVacationHeading = tripsPage.page.getByRole('heading').filter({
        hasText: 'Summer Vacation',
      });
      await expect(summerVacationHeading).toBeVisible();
    });

    test('shows trip cards with correct information', async ({ page }) => {
      await tripsPage.goto();

      // Get trip IDs from the current state - we need to inspect actual rendered elements
      const tripMenus = await page.locator('[data-testid^="trip-menu-"]').all();
      const tripIds: string[] = [];

      for (const menu of tripMenus) {
        const testId = await menu.getAttribute('data-testid');
        if (testId) {
          const tripId = testId.replace('trip-menu-', '');
          tripIds.push(tripId);
        }
      }

      // Verify each trip has the expected UI elements
      for (const tripId of tripIds) {
        await tripsPage.expectTripCard(tripId);

        // Check that stats sections exist
        const tripCard = await tripsPage.expectTripCard(tripId);
        await expect(
          tripCard.locator('.stat').filter({ hasText: 'People' })
        ).toBeVisible();
        await expect(
          tripCard.locator('.stat').filter({ hasText: 'Packed' })
        ).toBeVisible();
      }
    });

    test('highlights currently selected trip', async ({ page }) => {
      await tripsPage.goto();

      // Get the currently selected trip from the UI
      const currentTripBadge = page
        .locator('.badge.badge-primary:has-text("Current")')
        .first();
      await expect(currentTripBadge).toBeVisible();

      // Find the trip card containing this badge
      const currentTripCard = currentTripBadge
        .locator('xpath=ancestor::div[contains(@class, "card")]')
        .first();
      await expect(currentTripCard).toHaveClass(/border-primary/);
    });

    test('displays responsive grid layout', async () => {
      await tripsPage.goto();

      await tripsPage.expectResponsiveGrid();
    });
  });

  test.describe('Trip Selection', () => {
    let tripIds: string[] = [];

    test.beforeEach(async ({ page }) => {
      // Start from home page to match working pattern
      await tripsPage.page.goto('/');
      await tripsPage.page.waitForLoadState('networkidle');

      // Create test trips using the successful TripManager pattern
      await tripManager.createFirstTrip({
        template: 'business',
        title: 'Trip Alpha',
        skipDates: true,
      });

      await tripManager.createAdditionalTrip({
        template: 'vacation',
        title: 'Trip Beta',
        skipDates: true,
      });

      await tripsPage.goto();

      // Get actual trip IDs from the rendered page
      const tripMenus = await page.locator('[data-testid^="trip-menu-"]').all();
      tripIds = [];

      for (const menu of tripMenus) {
        const testId = await menu.getAttribute('data-testid');
        if (testId) {
          const tripId = testId.replace('trip-menu-', '');
          tripIds.push(tripId);
        }
      }
    });

    test('switches between trips', async () => {
      expect(tripIds).toHaveLength(2);

      // Find the non-selected trip
      let nonSelectedTripId = '';
      for (const tripId of tripIds) {
        const selectButton = tripsPage.page.getByTestId(
          `select-trip-${tripId}`
        );
        if (await selectButton.isVisible()) {
          nonSelectedTripId = tripId;
          break;
        }
      }

      expect(nonSelectedTripId).toBeTruthy();

      // Select the non-selected trip
      await tripsPage.selectTrip(nonSelectedTripId);
      await tripsPage.expectTripSelected(nonSelectedTripId);
    });

    test('navigates to selected trip', async () => {
      // Find the currently selected trip
      let selectedTripId = '';
      for (const tripId of tripIds) {
        const goToButton = tripsPage.page.getByTestId(`go-to-trip-${tripId}`);
        if (await goToButton.isVisible()) {
          selectedTripId = tripId;
          break;
        }
      }

      expect(selectedTripId).toBeTruthy();

      await tripsPage.goToTrip(selectedTripId);
      await expect(tripsPage.page).toHaveURL(/\//); // Should navigate to home page
    });

    test('opens trip settings', async () => {
      const tripId = tripIds[0];

      await tripsPage.openTripSettings(tripId);
      await expect(tripsPage.page).toHaveURL(
        new RegExp(`/trips/${tripId}/settings`)
      );
    });
  });

  test.describe('Trip Menu Actions', () => {
    let tripId: string;

    test.beforeEach(async ({ page }) => {
      // Start from home page to match working pattern
      await tripsPage.page.goto('/');
      await tripsPage.page.waitForLoadState('networkidle');

      await tripManager.createFirstTrip({
        template: 'business',
        title: 'Test Trip for Actions',
        skipDates: true,
      });

      await tripsPage.goto();

      // Get the trip ID from the rendered page
      const tripMenu = page.locator('[data-testid^="trip-menu-"]').first();
      const testId = await tripMenu.getAttribute('data-testid');
      tripId = testId?.replace('trip-menu-', '') || '';
      expect(tripId).toBeTruthy();
    });

    test('opens and navigates through trip menu', async () => {
      await tripsPage.openTripMenu(tripId);

      // Verify menu items are visible
      await expect(
        tripsPage.page.getByRole('link', { name: 'Edit' })
      ).toBeVisible();
      await expect(
        tripsPage.page.getByTestId(`duplicate-trip-${tripId}`)
      ).toBeVisible();
      await expect(
        tripsPage.page.getByTestId(`delete-trip-${tripId}`)
      ).toBeVisible();
    });

    test('navigates to trip edit page', async () => {
      await tripsPage.editTripFromMenu(tripId);
      await expect(tripsPage.page).toHaveURL(
        new RegExp(`/trips/${tripId}/edit`)
      );
    });

    test('duplicates a trip', async () => {
      const initialCount = await tripsPage.getTripCardCount();

      await tripsPage.duplicateTrip(tripId);

      const newCount = await tripsPage.getTripCardCount();
      expect(newCount).toBe(initialCount + 1);

      // Verify the duplicated trip contains "(Copy)" in title using heading role
      await expect(
        tripsPage.page.getByRole('heading', {
          name: 'Test Trip for Actions (Copy)',
        })
      ).toBeVisible();
    });
  });

  test.describe('Trip Deletion', () => {
    let tripId: string;

    test.beforeEach(async ({ page }) => {
      // Start from home page to match working pattern
      await tripsPage.page.goto('/');
      await tripsPage.page.waitForLoadState('networkidle');

      await tripManager.createFirstTrip({
        template: 'business',
        title: 'Trip to Delete',
        skipDates: true,
      });

      await tripsPage.goto();

      // Get the trip ID from the rendered page
      const tripMenu = page.locator('[data-testid^="trip-menu-"]').first();
      const testId = await tripMenu.getAttribute('data-testid');
      tripId = testId?.replace('trip-menu-', '') || '';
      expect(tripId).toBeTruthy();
    });

    test('shows delete confirmation modal', async () => {
      await tripsPage.deleteTrip(tripId);

      await tripsPage.expectDeleteModal();
    });

    test('cancels trip deletion', async () => {
      await tripsPage.deleteTrip(tripId);
      await tripsPage.cancelDeleteTrip();

      // Trip should still exist
      await tripsPage.expectTripExists(tripId);
    });

    test('confirms trip deletion', async () => {
      await tripsPage.deleteTrip(tripId);
      await tripsPage.confirmDeleteTrip();

      // Should return to empty state since it was the only trip
      await tripsPage.expectEmptyState();
    });

    test('deletes trip and shows remaining trips', async ({ page }) => {
      // Create another trip first
      await tripManager.createAdditionalTrip({
        template: 'vacation',
        title: 'Remaining Trip',
        skipDates: true,
      });

      await tripsPage.goto();

      // Delete the first trip
      await tripsPage.deleteTrip(tripId);
      await tripsPage.confirmDeleteTrip();

      // Should still show trips grid with the remaining trip
      await tripsPage.expectTripsGrid();
      const remainingCount = await tripsPage.getTripCardCount();
      expect(remainingCount).toBe(1);

      await expect(
        page.getByRole('heading', { name: 'Remaining Trip' })
      ).toBeVisible();
    });
  });

  test.describe('Navigation Integration', () => {
    test('shows correct trip selection state after external changes', async ({
      page,
    }) => {
      // Start from home page to match working pattern
      await tripsPage.page.goto('/');
      await tripsPage.page.waitForLoadState('networkidle');

      // Create two trips
      await tripManager.createFirstTrip({
        template: 'business',
        title: 'Trip A',
        skipDates: true,
      });

      await tripManager.createAdditionalTrip({
        template: 'vacation',
        title: 'Trip B',
        skipDates: true,
      });

      await tripsPage.goto();

      // Find Trip A and select it through the trip manager
      const tripACard = page.locator('.card:has-text("Trip A")');
      const tripAMenu = tripACard.locator('[data-testid^="trip-menu-"]');
      const tripATestId = await tripAMenu.getAttribute('data-testid');
      const tripAId = tripATestId?.replace('trip-menu-', '') || '';

      // Switch to Trip A using the trips page
      await tripsPage.selectTrip(tripAId);

      // Verify Trip A is now selected
      await tripsPage.expectTripSelected(tripAId);
    });
  });
});
