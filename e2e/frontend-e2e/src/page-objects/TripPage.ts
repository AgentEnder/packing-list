import { Page } from '@playwright/test';

export class TripPage {
  constructor(protected page: Page) {}

  async goto() {
    // Use the sidebar navigation instead of direct page.goto
    try {
      const tripLink = this.page.getByRole('link', { name: 'Days' });
      await tripLink.waitFor({ state: 'visible', timeout: 10000 });
      await tripLink.click({ force: true });

      // Wait for the page to load
      await this.page.waitForSelector(
        '[data-testid="configure-trip-button"], .btn:has-text("Configure Trip")',
        {
          timeout: 10000,
        }
      );
    } catch (error) {
      console.warn('Error navigating to Trip page:', error);
      // Fallback to direct navigation
      await this.page.goto('/days');
      await this.page.waitForLoadState('networkidle');
    }
  }

  async configureTrip(options: {
    leaveDate: string;
    returnDate: string;
    destinations?: Array<{
      location: string;
      arriveDate: string;
      leaveDate: string;
    }>;
  }) {
    // Open trip configuration wizard
    await this.page.getByRole('button', { name: 'Configure Trip' }).click();

    // Step 1: Set trip dates
    await this.page
      .locator('input[name="leaveHomeDate"]')
      .fill(options.leaveDate);
    await this.page
      .locator('input[name="arriveHomeDate"]')
      .fill(options.returnDate);
    await this.page.getByRole('button', { name: 'Next' }).click();

    // Step 2: Add destinations (if provided)
    if (options.destinations && options.destinations.length > 0) {
      for (const destination of options.destinations) {
        console.log(`Adding destination: ${destination.location}`);
        await this.page
          .locator('input[name="location"]')
          .fill(destination.location);
        await this.page
          .locator('input[name="arriveDate"]')
          .fill(destination.arriveDate);
        await this.page
          .locator('input[name="leaveDate"]')
          .fill(destination.leaveDate);
        await this.page
          .getByRole('button', { name: 'Add Destination' })
          .click();
      }
    }

    await this.page.getByRole('button', { name: 'Next' }).click();

    // Step 3: Save trip
    await this.page.getByRole('button', { name: 'Save Trip' }).click();

    // Wait a bit for the trip to be saved
    await this.page.waitForTimeout(1000);

    console.log('Trip configuration completed');
  }

  async getDayRowsCount() {
    // Don't navigate here to avoid state loss - assume we're already on the right page
    const count = await this.page.locator('[data-testid^="day-row-"]').count();
    console.log(`Current day rows count: ${count}`);
    return count;
  }
}
