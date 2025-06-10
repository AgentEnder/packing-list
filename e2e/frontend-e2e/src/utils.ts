import { BrowserContext, Page } from '@playwright/test';
import { SettingsPage } from './page-objects/SettingsPage.js';

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
            await new Promise<void>((resolve) => {
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
