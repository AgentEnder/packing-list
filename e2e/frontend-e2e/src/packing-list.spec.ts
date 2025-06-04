import { test } from '@playwright/test';
import { setupTestSession } from './utils.js';

test.describe('Packing List View', () => {
  test.beforeEach(async ({ page, context }) => {
    // Use demo data when testing the packing list
    await setupTestSession(page, context, true);
  });
});
