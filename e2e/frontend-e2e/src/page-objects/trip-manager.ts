import { Page, expect } from '@playwright/test';

export class TripManager {
  constructor(private page: Page) {}

  /**
   * Creates a new trip using the trip creation wizard
   */
  async createTrip(options: {
    template: 'business' | 'vacation' | 'weekend';
    title: string;
    skipDates?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    // Use in-app navigation to get to trips page
    if (this.page.url() !== '/trips') {
      // Try to find trip selector or navigation element to get to trips
      const tripSelectorButton = this.page.getByTestId('trip-selector').filter({
        visible: true,
      });
      const noTripSelected = this.page.getByTestId('no-trip-selected').filter({
        visible: true,
      });

      const nav = tripSelectorButton.or(noTripSelected);

      if (await nav.count()) {
        await nav.click();
        await this.page.waitForLoadState('networkidle');
      } else {
        // Fallback to direct navigation
        await this.page.goto('/trips');
        await this.page.waitForLoadState('networkidle');
      }
    }
    await this.page
      .locator('a[href="/trips/new"]')
      .filter({ visible: true })
      .first()
      .click();
    await expect(this.page).toHaveURL('/trips/new');

    await this.page.getByTestId(`template-${options.template}`).click();
    await this.page.getByTestId('trip-title-input').fill(options.title);

    if (options.skipDates || (!options.startDate && !options.endDate)) {
      await this.page.getByTestId('skip-dates-submit').click();
    } else {
      if (options.startDate) {
        await this.page
          .getByTestId('trip-start-date-input')
          .fill(options.startDate);
      }
      if (options.endDate) {
        await this.page
          .getByTestId('trip-end-date-input')
          .fill(options.endDate);
      }
      await this.page.getByTestId('create-trip-submit').click();
    }

    // Should redirect to overview
    await expect(this.page).toHaveURL('/');
  }

  /**
   * Creates a trip from the NoTripSelected state (when no trips exist)
   */
  async createFirstTrip(options: {
    template: 'business' | 'vacation' | 'weekend';
    title: string;
    skipDates?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    // Navigate to home page first to ensure we're in the right state
    await this.page.locator('a[href="/"]').click();
    await this.page.waitForLoadState('networkidle');

    // Check if we're in the no-trip-selected state
    const noTripSelected = this.page.getByTestId('no-trip-selected');
    const isNoTripVisible = await noTripSelected.isVisible();

    if (!isNoTripVisible) {
      // Check if there's a selected trip by looking for trip selector
      const tripSelector = this.page.getByTestId('trip-selector');
      const hasTripSelector = await tripSelector.isVisible().catch(() => false);

      if (hasTripSelector) {
        // There's a selected trip, clear it by clearing all trips

        await this.clearAllExistingTrips();

        // Navigate back to home page
        await this.page.goto('/');
        await this.page.waitForLoadState('networkidle');

        // Double-check if we now have no-trip-selected
        const noTripAfterClear = await this.page
          .getByTestId('no-trip-selected')
          .isVisible();
        console.log(
          `No-trip-selected visible after clear: ${noTripAfterClear}`
        );

        if (!noTripAfterClear) {
          // If still not in no-trip state, force database cleanup

          await this.page.evaluate(() => {
            // Clear all trips from the Redux store
            if ((window as any).store) {
              (window as any).store.dispatch({ type: 'CLEAR_ALL_TRIPS' });
            }
          });

          // Reload the page to ensure clean state
          await this.page.reload();
          await this.page.waitForLoadState('networkidle');
        }
      }
    }

    // Final check - now we should be able to see the no-trip-selected element
    const finalCheck = await this.page
      .getByTestId('no-trip-selected')
      .isVisible();

    if (!finalCheck) {
      // Get page content for debugging
      const pageContent = await this.page.content();
      console.log('Current page URL:', this.page.url());
      console.log('Page title:', await this.page.title());

      // Check what's actually on the page
      const tripSelectorExists = await this.page
        .getByTestId('trip-selector')
        .isVisible()
        .catch(() => false);
      const tripSelectorEmpty = await this.page
        .getByTestId('trip-selector-empty')
        .isVisible()
        .catch(() => false);
      const hasTripsTitle = await this.page
        .getByText('Current Trip Status')
        .isVisible()
        .catch(() => false);

      console.log(
        `Debugging - tripSelector: ${tripSelectorExists}, tripSelectorEmpty: ${tripSelectorEmpty}, hasTripsTitle: ${hasTripsTitle}`
      );

      // Last resort: Force clear the store directly and reload

      await this.page.evaluate(() => {
        if ((window as any).store) {
          const store = (window as any).store;
          // Force clear everything
          store.dispatch({ type: 'CLEAR_ALL_TRIPS' });
          store.dispatch({ type: 'SELECT_TRIP', payload: { tripId: null } });
          store.dispatch({ type: 'CLEAR_ALL_PEOPLE' });
          // Force update the state
          store.dispatch({ type: 'FORCE_NO_TRIP_STATE' });
        }
      });

      // Reload and check again
      await this.page.reload();
      await this.page.waitForLoadState('networkidle');

      const afterForceCheck = await this.page
        .getByTestId('no-trip-selected')
        .isVisible();

      if (!afterForceCheck) {
        throw new Error(
          `Expected no-trip-selected state but page shows trip dashboard. Check logs for debugging info.`
        );
      }
    }

    await expect(this.page.getByTestId('no-trip-selected')).toBeVisible();
    await this.createTrip(options);
  }

  /**
   * Clears all existing trips by navigating to trips page and deleting them
   */
  public async clearAllExistingTrips() {
    await this.navigateToTripsPage();

    // Wait for page to load and check what's there
    await this.page.waitForLoadState('networkidle');

    // Check if there are any trip menus (which indicate existing trips)
    const tripMenus = this.page.locator('[data-testid^="trip-menu-"]');
    const tripCount = await tripMenus.count();

    if (tripCount === 0) {
      return; // No trips to delete
    }

    // Delete all existing trips one by one
    let deleteAttempts = 0;
    const maxAttempts = tripCount + 2; // Safety margin

    while (deleteAttempts < maxAttempts) {
      deleteAttempts++;

      // Re-check trip count
      const currentTripMenus = this.page.locator('[data-testid^="trip-menu-"]');
      const currentCount = await currentTripMenus.count();

      console.log(
        `Deletion attempt ${deleteAttempts}: ${currentCount} trips remaining`
      );

      if (currentCount === 0) {
        break;
      }

      // Get the first trip menu that's still visible
      const firstTripMenu = currentTripMenus.first();

      // Only proceed if the menu is still visible
      if (await firstTripMenu.isVisible()) {
        // Get the trip ID from the test ID
        const testId = await firstTripMenu.getAttribute('data-testid');

        if (testId) {
          const tripId = testId.replace('trip-menu-', '');

          try {
            // Click the menu
            await firstTripMenu.click();

            // Wait for dropdown to be visible
            await this.page.waitForTimeout(200);

            // Click delete button for this specific trip
            const deleteButton = this.page.getByTestId(`delete-trip-${tripId}`);
            await deleteButton.click();

            // Confirm deletion
            await this.page.getByTestId('confirm-delete-trip').click();

            // Wait for the deletion to complete and UI to update
            await this.page.waitForTimeout(1500);
          } catch (error) {
            console.log(`Error deleting trip ${tripId}:`, error);
            // Try to close any open dropdowns and continue
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(500);
          }
        }
      } else {
        break;
      }
    }

    // Final verification
    const finalTripCount = await this.page
      .locator('[data-testid^="trip-menu-"]')
      .count();

    if (finalTripCount > 0) {
      console.warn(
        `Warning: ${finalTripCount} trips still remain after cleanup`
      );
    }
  }

  /**
   * Creates an additional trip by navigating to trips page first
   */
  async createAdditionalTrip(options: {
    template: 'business' | 'vacation' | 'weekend';
    title: string;
    skipDates?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    await this.navigateToTripsPage();
    await this.page.getByRole('link', { name: 'New Trip' }).click();

    await this.page.getByTestId(`template-${options.template}`).click();
    await this.page.getByTestId('trip-title-input').fill(options.title);

    if (options.skipDates || (!options.startDate && !options.endDate)) {
      await this.page.getByTestId('skip-dates-submit').click();
    } else {
      if (options.startDate) {
        await this.page
          .getByTestId('trip-start-date-input')
          .fill(options.startDate);
      }
      if (options.endDate) {
        await this.page
          .getByTestId('trip-end-date-input')
          .fill(options.endDate);
      }
      await this.page.getByTestId('create-trip-submit').click();
    }

    await expect(this.page).toHaveURL('/');
  }

  /**
   * Navigates to the trips page using the visible trip selector
   */
  async navigateToTripsPage() {
    await this.page
      .getByTestId('trip-selector')
      .locator('visible=true')
      .or(this.page.getByTestId('trip-selector-empty').locator('visible=true'))
      .click();
    await expect(this.page).toHaveURL('/trips');
  }

  /**
   * Navigates to home page
   */
  async navigateToHome() {
    await this.page.getByRole('link', { name: 'Packing List' }).first().click();
    await expect(this.page).toHaveURL('/');
  }

  /**
   * Switches to a specific trip by name
   */
  async switchToTrip(tripName: string) {
    await this.navigateToTripsPage();

    // Find the trip card with the given name first, then locate its switch button
    const tripCard = this.page.locator('.card').filter({ hasText: tripName });
    const switchButton = tripCard.getByText('Switch to Trip');

    await switchButton.click();
    await this.navigateToHome();
  }

  /**
   * Deletes a trip by name
   */
  async deleteTrip(tripName: string) {
    await this.navigateToTripsPage();

    // Find the trip card with the given name first, then locate its menu
    const tripCard = this.page.locator('.card').filter({ hasText: tripName });
    const tripMenu = tripCard.locator('[data-testid*="trip-menu-"]');
    await tripMenu.click();

    // Click delete button within this trip card
    const deleteButton = tripCard.locator('[data-testid*="delete-trip-"]');
    await deleteButton.click();

    // Confirm deletion
    await this.page.getByTestId('confirm-delete-trip').click();

    // Should stay on trips page
    await expect(this.page).toHaveURL('/trips');
  }

  /**
   * Duplicates a trip by name
   */
  async duplicateTrip(tripName: string) {
    await this.navigateToTripsPage();

    // Find the trip card with the given name first, then locate its menu
    const tripCard = this.page.locator('.card').filter({ hasText: tripName });
    const tripMenu = tripCard.locator('[data-testid*="trip-menu-"]');
    await tripMenu.click();

    // Click duplicate button within this trip card
    const duplicateButton = tripCard.locator(
      '[data-testid*="duplicate-trip-"]'
    );
    await duplicateButton.click();

    // Should stay on trips page
    await expect(this.page).toHaveURL('/trips');
  }

  /**
   * Verifies that a trip is currently selected by checking the trip selector
   */
  async expectTripSelected(tripName: string) {
    // Use the same approach that worked in the original tests - first match to avoid strict mode violations
    const tripSelector = this.page
      .locator('[data-testid*="trip-selector"]')
      .first();
    await expect(tripSelector).toContainText(tripName);
  }

  /**
   * Verifies that no trip is selected (shows NoTripSelected state)
   */
  async expectNoTripSelected() {
    // Check for the common no trip selected component that appears on all pages
    await expect(this.page.getByTestId('no-trip-selected')).toBeVisible();

    // The title text varies by page, so check for either common option
    const homePageTitle = this.page.getByText('Welcome to Smart Packing List!');
    const otherPageTitle = this.page.getByText('No Trip Selected');

    const homePageVisible = await homePageTitle.isVisible().catch(() => false);
    const otherPageVisible = await otherPageTitle
      .isVisible()
      .catch(() => false);

    if (!homePageVisible && !otherPageVisible) {
      throw new Error(
        'Expected either "Welcome to Smart Packing List!" or "No Trip Selected" to be visible'
      );
    }
  }

  /**
   * Verifies the number of trips with a given name in the trips list
   */
  async expectTripCount(tripName: string, count: number) {
    await this.navigateToTripsPage();
    const tripCards = this.page.locator('.card').filter({ hasText: tripName });
    await expect(tripCards).toHaveCount(count);
  }

  /**
   * Verifies that the create first trip link is visible (empty trips state)
   */
  async expectEmptyTripsState() {
    await expect(this.page.getByTestId('create-first-trip-link')).toBeVisible();
  }
}
