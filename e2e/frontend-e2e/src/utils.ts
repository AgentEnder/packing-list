import { BrowserContext, Page } from '@playwright/test';
import { SettingsPage } from './page-objects/SettingsPage.js';

async function dismissAnyOpenModals(page: Page) {
  try {
    const demoBanner = page.locator(
      '.fixed.bottom-0.left-0.right-0.bg-primary.z-\\[9999\\]'
    );
    if (await demoBanner.isVisible()) {
      const clearButton = demoBanner.getByRole('button', { name: 'Clear' });
      if (await clearButton.isVisible()) {
        await clearButton.click();
      }
    }

    // Specifically handle the rule pack modal which has high z-index
    const rulePackModal = page.getByTestId('rule-pack-modal');
    if (await rulePackModal.isVisible()) {
      // Try specific rule pack modal close buttons
      const rulePackCloseSelectors = [
        '[data-testid="rule-pack-close-button"]',
        '[data-testid="rule-pack-cancel-button"]',
        '[data-testid="close-rule-pack-modal"]',
      ];

      let closed = false;
      for (const selector of rulePackCloseSelectors) {
        const closeButton = rulePackModal.locator(selector).first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          if (!(await rulePackModal.isVisible())) {
            closed = true;
            break;
          }
        }
      }

      // If specific buttons didn't work, try pressing Escape
      if (!closed) {
        await page.keyboard.press('Escape');

        if (!(await rulePackModal.isVisible())) {
          closed = true;
        }
      }

      // If still not closed, try clicking outside the modal
      if (!closed) {
        await page.click('body', { position: { x: 10, y: 10 } });
      }
    }

    // Check for any other open modals and close them
    const modal = page.locator('.modal.modal-open').first();
    if (await modal.isVisible()) {
      // Try multiple methods to close the modal
      const closeSelectors = [
        '[data-testid="close-modal-button"]',
        '[data-testid="cancel-button"]',
        '[data-testid="create-rule-discard-button"]',
        '.btn-ghost:has-text("Cancel")',
        '.btn-ghost:has-text("Close")',
        '.btn:has(.w-5.h-5)', // Icon buttons like X
        '.modal-action .btn',
      ];

      let closed = false;
      for (const selector of closeSelectors) {
        const closeButton = modal.locator(selector).first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          // Check if modal is now closed
          if (!(await modal.isVisible())) {
            closed = true;
            break;
          }
        }
      }

      // If no close button worked, try pressing Escape
      if (!closed) {
        await page.keyboard.press('Escape');
      }

      // If still not closed, try clicking outside the modal
      if (await modal.isVisible()) {
        await page.click('body', { position: { x: 10, y: 10 } });
      }

      // Wait for modal to close (with timeout)
      try {
        await modal.waitFor({ state: 'hidden', timeout: 3000 });
      } catch {
        // Modal may still be visible, but continuing...
      }
    }
  } catch (error) {
    // Modal might not exist or already be closed, continue
    console.error('No modal found or error dismissing modal:', error);
  }
}

export type SetupMode = 'fresh' | 'demo' | 'auto-demo';

export async function setupTestSession(
  page: Page,
  context: BrowserContext,
  mode: SetupMode = 'fresh' // Changed default to 'fresh' since most tests should test actual flows
) {
  // Prevent any automatic demo data loading
  await page.addInitScript(`
    // Prevent automatic demo loading by setting session storage to fresh
    sessionStorage.setItem('session-demo-choice', 'fresh');
  `);

  // Navigate to home page first
  await page.goto('/');

  // Clear all storage after page loads to ensure clean state
  await page.evaluate(async () => {
    // Clear localStorage
    localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear IndexedDB databases
    try {
      // Get all databases and delete them
      if ('indexedDB' in window) {
        // Clear the main app database
        const deleteDbNames = [
          'PackingListOfflineDB',
          'packing_list_offline_auth',
          'PackingListReduxPersist', // In case there's redux persist
        ];

        for (const dbName of deleteDbNames) {
          try {
            const deleteReq = indexedDB.deleteDatabase(dbName);
            await new Promise<void>((resolve, reject) => {
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => resolve(); // Don't fail if DB doesn't exist
              deleteReq.onblocked = () => {
                console.warn(`Delete of ${dbName} was blocked`);
                resolve(); // Don't fail, just continue
              };
            });
          } catch (e) {
            console.warn(`Failed to delete database ${dbName}:`, e);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to clear IndexedDB:', e);
    }
  });

  // // Refresh the page to ensure the app starts with clean state
  // await page.reload();

  if (mode === 'demo') {
    // For demo mode, use the settings page to load demo data (settings works without trip selection)
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.loadDemoData();

    // Wait for demo data to load by checking for demo banner
    await page.waitForSelector("text=You're currently using demo data", {
      timeout: 10000,
    });
  } else if (mode === 'auto-demo') {
    // For auto-demo mode, use the new NoTripSelected component's demo button
    // This tests the actual user flow for discovering and loading demo data

    // Wait for the NoTripSelected component to appear
    await page.waitForSelector('text=Welcome to Smart Packing List!', {
      timeout: 5000,
    });

    // Click the demo button
    const demoButton = page.getByRole('button', { name: 'Try Demo Trip' });
    if (await demoButton.isVisible()) {
      await demoButton.click();
      // Wait for demo data to load
      await page.waitForSelector("text=You're currently using demo data", {
        timeout: 10000,
      });
    }
  }
  // For 'fresh' mode, we don't load any demo data - just stay in fresh state

  // Dismiss any modals or banners that appeared
  await dismissAnyOpenModals(page);

  // Wait for page to be ready
  await page.waitForLoadState('networkidle');
}

// Backward compatibility function
export async function setupTestSessionOld(
  page: Page,
  context: BrowserContext,
  useDemo = false
) {
  return setupTestSession(page, context, useDemo ? 'demo' : 'fresh');
}
