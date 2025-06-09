import { Page, expect } from '@playwright/test';

export class TripWizardPage {
  constructor(private page: Page) {}

  async verifyWizardPage() {
    await expect(this.page).toHaveURL(/\/trips\/.*\/wizard/);
    await expect(
      this.page.getByRole('heading', { name: 'Configure Trip' })
    ).toBeVisible();
  }

  async verifyInitialEvents(location?: string) {
    await expect(this.page.getByText('Leave Home')).toBeVisible();
    if (location) {
      await expect(
        this.page.getByTestId(`timeline-event-arrive_destination-${location}`)
      ).toBeVisible();
      await expect(
        this.page.getByTestId(`timeline-event-leave_destination-${location}`)
      ).toBeVisible();
    }
    await expect(this.page.getByText('Arrive Home')).toBeVisible();
  }

  async saveWizard() {
    // Try both possible button texts
    const saveButton = this.page.getByRole('button', {
      name: /Save Trip|Update Trip/,
    });
    await saveButton.click();
  }

  async navigateToReviewStep() {
    // Navigate through the wizard steps to reach the review/save step
    await this.page.getByRole('button', { name: 'Next' }).click();
    await this.page.getByRole('button', { name: 'Next' }).click();
  }
}
