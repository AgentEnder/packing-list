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
    await this.page.getByTestId('create-new-trip-button').click();
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
    // Should be on home page with no trip selected
    await expect(this.page.getByTestId('no-trip-selected')).toBeVisible();
    await this.createTrip(options);
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
