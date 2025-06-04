import { BrowserContext, Page } from '@playwright/test';
import { SettingsPage } from './page-objects/SettingsPage.js';

async function dismissAnyOpenModals(page: Page) {
  try {
    // Wait a bit for any modals to fully render
    await page.waitForTimeout(500);

    // First, dismiss the demo banner if it's visible
    const demoBanner = page.locator(
      '.fixed.bottom-0.left-0.right-0.bg-primary.z-\\[9999\\]'
    );
    if (await demoBanner.isVisible()) {
      console.log('Found demo banner, attempting to close...');
      const clearButton = demoBanner.getByRole('button', { name: 'Clear' });
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await page.waitForTimeout(500);
        console.log('Demo banner cleared');
      }
    }

    // Specifically handle the rule pack modal which has high z-index
    const rulePackModal = page.getByTestId('rule-pack-modal');
    if (await rulePackModal.isVisible()) {
      console.log('Found rule pack modal, attempting to close...');

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
          console.log(`Clicking rule pack close button: ${selector}`);
          await closeButton.click();
          await page.waitForTimeout(500);
          if (!(await rulePackModal.isVisible())) {
            closed = true;
            console.log('Rule pack modal closed successfully');
            break;
          }
        }
      }

      // If specific buttons didn't work, try pressing Escape
      if (!closed) {
        console.log('Rule pack modal close buttons failed, trying Escape...');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        if (!(await rulePackModal.isVisible())) {
          closed = true;
          console.log('Rule pack modal closed with Escape');
        }
      }

      // If still not closed, try clicking outside the modal
      if (!closed) {
        console.log('Rule pack modal still open, trying to click outside...');
        await page.click('body', { position: { x: 10, y: 10 } });
        await page.waitForTimeout(500);
      }
    }

    // Check for any other open modals and close them
    const modal = page.locator('.modal.modal-open').first();
    if (await modal.isVisible()) {
      console.log('Found other open modal, attempting to close...');

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
          console.log(`Clicking close button: ${selector}`);
          await closeButton.click();
          await page.waitForTimeout(500);
          // Check if modal is now closed
          if (!(await modal.isVisible())) {
            closed = true;
            break;
          }
        }
      }

      // If no close button worked, try pressing Escape
      if (!closed) {
        console.log('No close button found, trying Escape key...');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }

      // If still not closed, try clicking outside the modal
      if (await modal.isVisible()) {
        console.log('Modal still open, trying to click outside...');
        await page.click('body', { position: { x: 10, y: 10 } });
        await page.waitForTimeout(500);
      }

      // Wait for modal to close (with timeout)
      try {
        await modal.waitFor({ state: 'hidden', timeout: 3000 });
        console.log('Modal successfully closed');
      } catch {
        console.log('Modal may still be visible, but continuing...');
      }
    }
  } catch (error) {
    // Modal might not exist or already be closed, continue
    console.log('No modal found or error dismissing modal:', error);
  }
}

export async function setupTestSession(
  page: Page,
  context: BrowserContext,
  useDemo = false
) {
  // Dismiss the automatic demo loading first
  await page.addInitScript(`
    // Prevent demo modal by setting session storage
    sessionStorage.setItem('session-demo-choice', 'fresh');
  `);

  // Navigate to home page first
  await page.goto('/');

  // Dismiss any modals or banners that appeared
  await dismissAnyOpenModals(page);

  if (useDemo) {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.loadDemoData();
  }

  // Wait for page to be ready
  await page.waitForLoadState('networkidle');
}
