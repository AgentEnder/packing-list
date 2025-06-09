import { Page } from '@playwright/test';

export class FlowNavigationHelper {
  constructor(private page: Page) {}

  async continueToNextStep() {
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }

  async navigateBack() {
    await this.page.getByTestId('flow-back-button').click();
  }
}
