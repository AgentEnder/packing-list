import { Page } from '@playwright/test';

export class PackItemsModal {
  constructor(private page: Page) {}

  async isVisible() {
    const modal = this.page.locator('.modal.modal-open');
    return modal.isVisible();
  }

  async close() {
    await this.page.getByRole('button', { name: 'Close' }).click();
    await this.waitForClose();
  }

  async toggleItem(itemName: string) {
    await this.page
      .getByText(itemName)
      .locator('..')
      .getByRole('checkbox')
      .click();
  }

  private async waitForClose() {
    await this.page
      .locator('.modal.modal-open')
      .waitFor({ state: 'hidden', timeout: 5000 });
  }
}
