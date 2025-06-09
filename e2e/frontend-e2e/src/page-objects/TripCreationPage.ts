import { Page } from '@playwright/test';
import { format } from 'date-fns';

export class TripCreationPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/trips/new');
  }

  async selectTemplate(templateId: string) {
    await this.page.getByTestId(`template-${templateId}`).click();
  }

  async fillTripDetails({
    title,
    description,
    location,
    startDate,
    endDate,
  }: {
    title: string;
    description?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
  }) {
    await this.page.getByTestId('trip-title-input').fill(title);

    if (description) {
      await this.page.getByTestId('trip-description-input').fill(description);
    }

    if (location) {
      await this.page.getByTestId('trip-location-input').fill(location);
    }

    if (startDate) {
      await this.page.getByTestId('trip-start-date-input').fill(startDate);
    }

    if (endDate) {
      await this.page.getByTestId('trip-end-date-input').fill(endDate);
    }
  }

  async submitTripDetails() {
    await this.page.getByTestId('create-trip-submit').click();
  }

  async skipDates() {
    await this.page.getByTestId('skip-dates-submit').click();
  }

  // Helper method to create test dates
  static getTestDates() {
    const startDate = format(new Date(), 'yyyy-MM-dd');
    const endDate = format(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      'yyyy-MM-dd'
    );
    return { startDate, endDate };
  }
}
