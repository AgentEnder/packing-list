import { Page } from '@playwright/test';

export class SettingsPage {
  constructor(private page: Page) {}

  async goto() {
    // Navigate using the sidebar link to preserve state
    const settingsLink = this.page.getByRole('link', { name: 'Settings' });
    await settingsLink.waitFor({ state: 'visible', timeout: 10000 });
    await settingsLink.click();

    // Wait for settings page to load by checking for the page header
    await this.page.waitForSelector('text=Settings', {
      timeout: 10000,
    });

    // Also wait for the cards to be visible
    await this.page.waitForSelector('text=Help & Tutorials', {
      timeout: 5000,
    });
  }

  // Help & Tutorials Methods
  async resetHelpMessages() {
    await this.page
      .getByRole('button', { name: 'Reset Help Messages' })
      .click();

    // Wait for toast message to appear
    await this.page.waitForSelector('text=Help messages have been reset', {
      timeout: 5000,
    });
  }

  async hideAllHelp() {
    await this.page.getByRole('button', { name: 'Hide All Help' }).click();

    // Wait for toast message to appear
    await this.page.waitForSelector('text=All help messages have been hidden', {
      timeout: 5000,
    });
  }

  // Demo Data Methods
  async loadDemoData() {
    await this.page.getByRole('button', { name: 'Load Demo Data' }).click();

    // Wait for toast message to appear
    await this.page.waitForSelector('text=Demo data has been loaded', {
      timeout: 5000,
    });
  }

  async clearDemoData() {
    await this.page.getByRole('button', { name: 'Clear' }).click();
  }
}
