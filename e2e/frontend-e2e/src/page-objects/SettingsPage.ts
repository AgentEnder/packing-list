import { Page } from '@playwright/test';

export class SettingsPage {
  constructor(public page: Page) {}

  async goto() {
    // Navigate using the sidebar link to preserve state
    const settingsLink = this.page.getByRole('link', { name: 'Settings' });
    await settingsLink.waitFor({ state: 'visible', timeout: 10000 });
    await settingsLink.click();

    // Wait for settings page to load by checking for the page header
    await this.page.waitForSelector('text=Settings', {
      timeout: 10000,
    });

    // Wait for the tab navigation to be visible
    await this.page.waitForSelector('.tabs.tabs-boxed', {
      timeout: 5000,
    });
  }

  // Tab Navigation Methods
  async switchToSettingsTab() {
    await this.page.getByRole('button', { name: 'Settings' }).click();

    // Wait for Help & Tutorials section to be visible (Settings tab content)
    await this.page.waitForSelector('text=Help & Tutorials', {
      timeout: 5000,
    });
  }

  async switchToAccountTab() {
    await this.page.getByRole('button', { name: 'Account' }).click();

    // Wait for either account content or sign-in prompt
    try {
      await this.page.waitForSelector('text=Offline Accounts', {
        timeout: 3000,
      });
    } catch {
      // If not authenticated, we should see the sign-in prompt
      await this.page.waitForSelector('text=Not Signed In', {
        timeout: 3000,
      });
    }
  }

  async switchToDebugTab() {
    await this.page.getByRole('button', { name: 'Debug & Status' }).click();

    // Wait for Connection Status section to be visible (Debug tab content)
    await this.page.waitForSelector('text=Connection Status', {
      timeout: 5000,
    });
  }

  // Settings Tab Methods
  async resetHelpMessages() {
    await this.switchToSettingsTab();

    await this.page
      .getByRole('button', { name: 'Reset Help Messages' })
      .click();

    // Wait for toast message to appear
    await this.page.waitForSelector('text=Help messages have been reset', {
      timeout: 5000,
    });
  }

  async hideAllHelp() {
    await this.switchToSettingsTab();

    await this.page.getByRole('button', { name: 'Hide All Help' }).click();

    // Wait for toast message to appear
    await this.page.waitForSelector('text=All help messages have been hidden', {
      timeout: 5000,
    });
  }

  async loadDemoData() {
    await this.switchToSettingsTab();

    await this.page.getByRole('button', { name: 'Load Demo Data' }).click();

    // Wait for toast message to appear
    await this.page.waitForSelector('text=Demo data has been loaded', {
      timeout: 5000,
    });
  }

  async clearDemoData() {
    await this.switchToSettingsTab();

    try {
      await this.page
        .getByRole('button', { name: 'Clear' })
        .click({ timeout: 1000 });
    } catch {
      // Demo data was likely not loaded.
    }
  }

  // Account Tab Methods
  async expectSignInRequired() {
    await this.switchToAccountTab();

    await this.page.waitForSelector('text=Not Signed In', {
      timeout: 5000,
    });

    await this.page.waitForSelector(
      'text=You need to be signed in to manage your account settings',
      {
        timeout: 3000,
      }
    );
  }

  async clickSignInFromAccount() {
    await this.switchToAccountTab();

    await this.page.getByRole('link', { name: 'Sign In' }).click();
  }

  async getOfflineAccountsCount() {
    await this.switchToAccountTab();

    try {
      // Check if accounts are visible
      const accountElements = await this.page
        .locator('.bg-base-200.rounded-lg')
        .count();
      return accountElements;
    } catch {
      return 0;
    }
  }

  // Debug Tab Methods
  async getConnectionStatus() {
    await this.switchToDebugTab();

    const statusBadge = this.page.locator('.badge-lg');
    return await statusBadge.textContent();
  }

  async isOnline() {
    const status = await this.getConnectionStatus();
    return status?.includes('Online') || false;
  }

  async isOffline() {
    const status = await this.getConnectionStatus();
    return status?.includes('Offline') || false;
  }

  async copySystemInfo() {
    await this.switchToDebugTab();

    await this.page.getByRole('button', { name: 'Copy System Info' }).click();

    // Wait for toast message
    await this.page.waitForSelector('text=System info copied to clipboard', {
      timeout: 5000,
    });
  }

  async viewBuildInfo() {
    await this.switchToDebugTab();

    // Click the "View Build Info" link which opens in a new tab
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.page.getByRole('link', { name: 'View Build Info' }).click(),
    ]);

    return newPage;
  }

  // Helper method to check if we're on a specific tab
  async getCurrentTab(): Promise<'settings' | 'account' | 'debug'> {
    const settingsTab = this.page.getByRole('button', { name: 'Settings' });
    const accountTab = this.page.getByRole('button', { name: 'Account' });
    const debugTab = this.page.getByRole('button', { name: 'Debug & Status' });

    if (
      await settingsTab
        .getAttribute('class')
        .then((cls) => cls?.includes('tab-active'))
    ) {
      return 'settings';
    } else if (
      await accountTab
        .getAttribute('class')
        .then((cls) => cls?.includes('tab-active'))
    ) {
      return 'account';
    } else if (
      await debugTab
        .getAttribute('class')
        .then((cls) => cls?.includes('tab-active'))
    ) {
      return 'debug';
    }

    // Default to settings if we can't determine
    return 'settings';
  }
}
