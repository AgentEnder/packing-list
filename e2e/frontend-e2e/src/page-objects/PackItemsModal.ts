import { Page } from '@playwright/test';

export class PackItemsModal {
  constructor(private page: Page) {}

  async isVisible() {
    // First try using the test ID for more reliable detection
    const modalByTestId = this.page.getByTestId('pack-items-modal');
    if (await modalByTestId.isVisible().catch(() => false)) {
      return true;
    }

    // Fallback to role-based detection
    const modal = this.page.getByRole('dialog').filter({
      has: this.page.getByRole('heading', { name: /Pack .+/i }),
    });

    try {
      await modal.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async close() {
    // Check if page is still available
    if (this.page.isClosed()) {
      return;
    }

    // Try the test ID first - this is the most reliable
    const closeByTestId = this.page.getByTestId('pack-dialog-close');
    if (await closeByTestId.isVisible().catch(() => false)) {
      try {
        await closeByTestId.click();
      } catch (error) {
        // If page is closed during test, just return
        if (error.message?.includes('closed') || this.page.isClosed()) {
          return;
        }
        // If blocked by toast or other elements, force the click
        await closeByTestId.click({ force: true });
      }
    } else {
      // Fallback to the specific Close button in the modal action (not the backdrop)
      const closeButton = this.page
        .getByRole('dialog')
        .locator('.modal-action')
        .getByRole('button', { name: 'Close' });
      try {
        await closeButton.click();
      } catch (error) {
        // If page is closed during test, just return
        if (error.message?.includes('closed') || this.page.isClosed()) {
          return;
        }
        // If blocked by toast or other elements, force the click
        await closeButton.click({ force: true });
      }
    }
    await this.waitForClose();
  }

  async toggleItem(itemName: string) {
    // Find the checkbox associated with the item by looking for text containing the item name
    // The items are in label elements within the modal content
    const modalContent = this.page.getByTestId('pack-dialog-content');
    const itemLabel = modalContent.locator('label').filter({
      hasText: itemName,
    });

    // Get the first checkbox if there are multiple instances
    const checkbox = itemLabel.getByRole('checkbox').first();
    await checkbox.click();
  }

  async getItemCount(): Promise<number> {
    // Count all checkboxes in the modal content
    const modalContent = this.page.getByTestId('pack-dialog-content');
    return modalContent.getByRole('checkbox').count();
  }

  async getItemNames(): Promise<string[]> {
    // Get all item labels in the modal content
    const modalContent = this.page.getByTestId('pack-dialog-content');
    const labels = modalContent.locator('label');
    const count = await labels.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await labels.nth(i).textContent();
      if (text) {
        // Extract the item name (first part before any quantity info)
        const name = text.split('(')[0].trim();
        names.push(name);
      }
    }

    return names;
  }

  private async waitForClose() {
    // Check if page is still available
    if (this.page.isClosed()) {
      return;
    }

    try {
      // Try test ID first
      const modalByTestId = this.page.getByTestId('pack-items-modal');
      try {
        await modalByTestId.waitFor({ state: 'hidden', timeout: 2000 });
        return;
      } catch {
        // Fallback to role-based detection
        const modal = this.page.getByRole('dialog').filter({
          has: this.page.getByRole('heading', { name: /Pack .+/i }),
        });

        await modal.waitFor({ state: 'hidden', timeout: 5000 });
      }
    } catch (error) {
      // If page is closed or other errors, just return
      if (error.message?.includes('closed') || this.page.isClosed()) {
        return;
      }
      // Re-throw other errors
      throw error;
    }
  }
}
