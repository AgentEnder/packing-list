import { test, expect } from '@playwright/test';
import { SettingsPage } from './page-objects/SettingsPage';

test.describe('Settings Page Tabs', () => {
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
    await page.goto('/');
    await settingsPage.goto();
  });

  test('should show three tabs: Settings, Account, and Debug & Status', async ({
    page,
  }) => {
    // Verify all three tabs are visible
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Debug & Status' })
    ).toBeVisible();
  });

  test('should default to Settings tab', async ({ page }) => {
    // Settings tab should be active by default
    const settingsTab = page.getByRole('button', { name: 'Settings' });
    await expect(settingsTab).toHaveClass(/tab-active/);

    // Help & Tutorials should be visible (Settings tab content)
    await expect(page.getByText('Help & Tutorials')).toBeVisible();
  });

  test('should switch to Account tab correctly', async () => {
    await settingsPage.switchToAccountTab();

    // Should see either account content or sign-in prompt
    const hasAccounts = (await settingsPage.getOfflineAccountsCount()) > 0;
    if (hasAccounts) {
      // If user has accounts, we should see the accounts section
      await expect(
        settingsPage.page.getByRole('heading', {
          name: 'Offline Accounts',
          exact: true,
        })
      ).toBeVisible();
    } else {
      // If not signed in, we should see the sign-in prompt
      await settingsPage.expectSignInRequired();
    }
  });

  test('should switch to Debug & Status tab correctly', async () => {
    await settingsPage.switchToDebugTab();

    // Should show debug tab content
    const connectionStatus = await settingsPage.getConnectionStatus();
    expect(connectionStatus).toMatch(/Online|Offline/);

    // Should see copy button
    await expect(
      settingsPage.page.getByRole('button', { name: 'Copy System Info' })
    ).toBeVisible();
  });

  test('should maintain tab state when switching between tabs', async () => {
    // Start on Settings tab
    await settingsPage.switchToSettingsTab();
    let currentTab = await settingsPage.getCurrentTab();
    expect(currentTab).toBe('settings');

    // Switch to Account tab
    await settingsPage.switchToAccountTab();
    currentTab = await settingsPage.getCurrentTab();
    expect(currentTab).toBe('account');

    // Switch to Debug tab
    await settingsPage.switchToDebugTab();
    currentTab = await settingsPage.getCurrentTab();
    expect(currentTab).toBe('debug');

    // Switch back to Settings tab
    await settingsPage.switchToSettingsTab();
    currentTab = await settingsPage.getCurrentTab();
    expect(currentTab).toBe('settings');
  });

  test('should allow demo data loading from Settings tab', async () => {
    await settingsPage.loadDemoData();

    // Verify demo data was loaded (should see toast message is handled by the page object)
    // The loadDemoData method already waits for the success message
  });

  test('should show system information in Debug tab', async ({ page }) => {
    await settingsPage.switchToDebugTab();

    // Should see system information sections
    await expect(page.getByText('System Information')).toBeVisible();
    await expect(page.getByText('Browser')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Storage' })).toBeVisible();

    // Should see copy button
    await expect(
      page.getByRole('button', { name: 'Copy System Info' })
    ).toBeVisible();
  });

  test('should handle connection status in Debug tab', async () => {
    const isOnline = await settingsPage.isOnline();
    const isOffline = await settingsPage.isOffline();

    // Should be either online or offline, but not both
    expect(isOnline || isOffline).toBe(true);
    expect(isOnline && isOffline).toBe(false);
  });
});
