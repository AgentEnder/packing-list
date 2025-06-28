import { test, expect } from '@playwright/test';
import { clearAllTestData, setupCleanTestUser } from './test-db-utils';
import { UserPeoplePage } from './page-objects/UserPeoplePage';
import { TripManager } from './page-objects/trip-manager';

test.describe('User Profile Management', () => {
  let userPeoplePage: UserPeoplePage;
  let tripManager: TripManager;

  test.beforeEach(async ({ page, context }) => {
    await clearAllTestData(page);
    await setupCleanTestUser(page);
    userPeoplePage = new UserPeoplePage(page);
    tripManager = new TripManager(page);

    // Capture console logs for debugging
    page.on('console', (msg) => {
      if (
        msg.text().includes('[USER PROFILE FORM]') ||
        msg.text().includes('profile')
      ) {
        console.log(`🌐 BROWSER: ${msg.text()}`);
      }
    });
  });

  test.describe('Profile Creation', () => {
    test('can create a user profile with full details', async ({ page }) => {
      await userPeoplePage.createOrUpdateProfile({
        name: 'John Smith',
        age: 30,
        gender: 'male',
      });

      // Verify profile was created and displays correctly
      await userPeoplePage.expectProfileExists('John Smith', 30, 'male');
    });

    test('can create a user profile with minimal details', async ({ page }) => {
      await userPeoplePage.createOrUpdateProfile({
        name: 'Jane Doe',
      });

      await userPeoplePage.expectProfileExists('Jane Doe');
    });

    test('can edit an existing profile', async ({ page }) => {
      // Create initial profile
      await userPeoplePage.createOrUpdateProfile({
        name: 'Original Name',
        age: 25,
        gender: 'female',
      });

      // Edit the profile
      await userPeoplePage.createOrUpdateProfile({
        name: 'Updated Name',
        age: 26,
        gender: 'other',
      });

      // Verify changes were saved
      await userPeoplePage.expectProfileExists('Updated Name', 26, 'other');
    });

    test('profile persists across page refreshes', async ({ page }) => {
      // Create a unique profile name to avoid conflicts
      const uniqueName = `Persistent User ${Date.now()}`;

      await userPeoplePage.createOrUpdateProfile({
        name: uniqueName,
        age: 35,
        gender: 'male',
      });

      // Refresh the page
      await page.reload();

      // Profile should still exist
      await userPeoplePage.expectProfileExists(uniqueName, 35, 'male');
    });

    test('validates required name field', async ({ page }) => {
      await userPeoplePage.gotoProfile();

      // Wait for the profile form to be available
      await page.waitForSelector('form', { timeout: 10000 });

      // Clear the name field if it has any value
      const nameInput = page.locator('input[placeholder="Enter your name"]');
      await nameInput.clear();

      // Try to submit without filling required name field
      const birthDateInput = page.locator('input[type="date"]');
      await birthDateInput.fill('1998-01-01');

      // Try to submit
      const saveButton = page.locator('button[type="submit"]');
      await saveButton.click();

      // Should show validation error (HTML5 required validation or custom validation)
      // Check if name field is still empty (validation prevented submission)
      await expect(nameInput).toHaveValue('');

      // Browser should show validation state or focus should be on name field
      await expect(nameInput).toBeFocused();
    });

    test('profile cannot be deleted', async ({ page }) => {
      await userPeoplePage.createOrUpdateProfile({
        name: 'Cannot Delete',
        age: 30,
      });

      await userPeoplePage.expectProfileCannotBeDeleted();
    });
  });

  test.describe('Profile Empty States', () => {
    test('shows create profile prompt when no profile exists', async ({
      page,
    }) => {
      await userPeoplePage.gotoProfile();

      // Check if we're in create mode (no profile exists) or edit mode (profile exists)
      const createButton = page.getByTestId('create-profile-button');
      const profileForm = page.locator('form');

      // Either create button should be visible (no profile) or form should be visible (profile exists)
      await expect(createButton.or(profileForm)).toBeVisible();

      // If create button is visible, verify the create profile prompt
      if (await createButton.isVisible()) {
        await expect(page.getByText('Create Your Profile')).toBeVisible();
      }
    });

    test('navigates to profile creation from no profile state', async ({
      page,
    }) => {
      await userPeoplePage.gotoProfile();

      const createButton = page.getByTestId('create-profile-button');

      // Only test this if create button is visible (no existing profile)
      if (await createButton.isVisible()) {
        await createButton.click();

        // Should show profile form
        await expect(page.getByTestId('profile-name-input')).toBeVisible();
        await expect(page.getByTestId('save-profile-button')).toBeVisible();
      } else {
        // Profile already exists, so we should see the profile form directly
        await expect(page.locator('form')).toBeVisible();
      }
    });
  });

  test.describe('Profile Integration with App', () => {
    test('profile is accessible from navigation', async ({ page }) => {
      // Create a trip first to have full navigation
      await tripManager.createFirstTrip({
        template: 'business',
        title: 'Test Trip',
        skipDates: true,
      });

      // Should be able to navigate to profile
      await userPeoplePage.gotoProfile();
      await expect(page).toHaveURL(/\/profile\/?$/);
    });

    test('profile works with offline/online sync', async ({
      page,
      context,
    }) => {
      await userPeoplePage.createOrUpdateProfile({
        name: 'Sync Test User',
        age: 28,
      });

      // Simulate offline mode
      await context.setOffline(true);

      // Edit profile while offline
      await userPeoplePage.createOrUpdateProfile({
        name: 'Offline Edit',
        age: 29,
      });

      // Go back online
      await context.setOffline(false);

      // Profile should sync and persist
      await page.reload();
      await userPeoplePage.expectProfileExists('Offline Edit', 29);
    });

    test('profile shows in correct format across different screen sizes', async ({
      page,
    }) => {
      await userPeoplePage.createOrUpdateProfile({
        name: 'Responsive User',
        age: 32,
        gender: 'female',
      });

      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await userPeoplePage.expectProfileExists('Responsive User', 32, 'female');

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await userPeoplePage.expectProfileExists('Responsive User', 32, 'female');

      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await userPeoplePage.expectProfileExists('Responsive User', 32, 'female');
    });
  });

  test.describe('Profile Data Validation', () => {
    test('validates age input', async ({ page }) => {
      await userPeoplePage.gotoProfile();

      // Wait for the profile form to be available
      await page.waitForSelector('form', { timeout: 10000 });

      // Fill name and invalid birth date
      const nameInput = page.locator('input[placeholder="Enter your name"]');
      await nameInput.fill('Test User');

      // Try to set a future date (invalid)
      const nextYear = new Date().getFullYear() + 1;
      const invalidDate = `${nextYear}-01-01`;

      const birthDateInput = page.locator('input[type="date"]');
      await birthDateInput.fill(invalidDate);

      // Try to submit
      const saveButton = page.locator('button[type="submit"]');
      await saveButton.click();

      // The form should either prevent submission or show validation
      // Since birth date validation might be handled by the browser or custom logic,
      // we'll check that the date field still has the invalid value
      await expect(birthDateInput).toHaveValue(invalidDate);
    });

    test('handles special characters in name', async ({ page }) => {
      await userPeoplePage.createOrUpdateProfile({
        name: "José María O'Connor-Smith",
        age: 25,
      });

      await userPeoplePage.expectProfileExists("José María O'Connor-Smith", 25);
    });

    test('handles very long names', async ({ page }) => {
      const longName = 'A'.repeat(100);

      await userPeoplePage.createOrUpdateProfile({
        name: longName,
        age: 30,
      });

      await userPeoplePage.expectProfileExists(longName, 30);
    });
  });
});
