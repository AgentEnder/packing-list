import { test, expect } from '@playwright/test';
import { clearAllTestData, setupCleanTestUser } from './test-db-utils';
import { UserPeoplePage } from './page-objects/UserPeoplePage';
import { TripManager } from './page-objects/trip-manager';
import { PeoplePage } from './page-objects/PeoplePage';

test.describe('Profile Auto-Addition to Trips', () => {
  let userPeoplePage: UserPeoplePage;
  let tripManager: TripManager;
  let peoplePage: PeoplePage;

  test.beforeEach(async ({ page }) => {
    await clearAllTestData(page);
    await setupCleanTestUser(page);
    userPeoplePage = new UserPeoplePage(page);
    tripManager = new TripManager(page);
    peoplePage = new PeoplePage(page);
  });

  test.describe('Profile Auto-Addition', () => {
    test('user profile automatically appears in new trip', async ({ page }) => {
      // Create user profile first
      await userPeoplePage.createOrUpdateProfile({
        name: 'Auto User',
        age: 30,
        gender: 'male',
      });

      // Create a new trip
      await tripManager.createFirstTrip({
        template: 'business',
        title: 'Business Trip',
        skipDates: true,
      });

      // Navigate to people page and verify profile is auto-added
      await peoplePage.goto();

      // Should see the profile user in the people list
      await expect(page.getByText('Auto User')).toBeVisible();

      // Find the profile card by looking for the card that contains "Auto User" and "You"
      const profileCard = page
        .locator('[data-testid^="person-card-"]')
        .filter({
          hasText: 'Auto User',
        })
        .filter({
          hasText: 'You',
        });

      await expect(profileCard).toBeVisible();
      await expect(profileCard.getByText('You')).toBeVisible();
    });

    test('profile shows with correct details in trip people', async ({
      page,
    }) => {
      await userPeoplePage.createOrUpdateProfile({
        name: 'Detailed User',
        age: 35,
        gender: 'female',
      });

      await tripManager.createFirstTrip({
        template: 'vacation',
        title: 'Vacation Trip',
        skipDates: true,
      });

      await peoplePage.goto();

      // Should show all profile details
      await expect(page.getByText('Detailed User')).toBeVisible();
      await expect(page.getByText('Age: 35')).toBeVisible();
      await expect(page.getByText('Gender: female')).toBeVisible();

      // Should be marked as profile - find by content instead of test ID
      const profileCard = page
        .locator('[data-testid^="person-card-"]')
        .filter({
          hasText: 'Detailed User',
        })
        .filter({
          hasText: 'You',
        });
      await expect(profileCard.getByText('You')).toBeVisible();
    });

    test('multiple trips all get the same profile', async ({ page }) => {
      // Create profile
      await userPeoplePage.createOrUpdateProfile({
        name: 'Multi Trip User',
        age: 28,
        gender: 'other',
      });

      // Create first trip
      await tripManager.createFirstTrip({
        template: 'business',
        title: 'First Trip',
        skipDates: true,
      });

      // Verify profile is in first trip
      await peoplePage.goto();
      await expect(page.getByText('Multi Trip User')).toBeVisible();

      // Create second trip
      await tripManager.createAdditionalTrip({
        template: 'vacation',
        title: 'Second Trip',
        skipDates: true,
      });

      // Verify profile is in second trip too
      await peoplePage.goto();
      await expect(page.getByText('Multi Trip User')).toBeVisible();

      // Should have profile indicator in both trips - find by content
      const profileCard = page
        .locator('[data-testid^="person-card-"]')
        .filter({
          hasText: 'Multi Trip User',
        })
        .filter({
          hasText: 'You',
        });
      await expect(profileCard.getByText('You')).toBeVisible();
    });
  });

  test.describe('Trip Creation with Profile', () => {
    test('trip creation works when user has no profile', async ({ page }) => {
      // No profile created

      await tripManager.createFirstTrip({
        template: 'business',
        title: 'No Profile Trip',
        skipDates: true,
      });

      // Should create trip successfully
      await expect(page).toHaveURL('/');

      // Navigate to people page - should show empty state (no profile to auto-add)
      await peoplePage.goto();
      await expect(page.getByText('No people added yet')).toBeVisible();
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('handles profile deletion edge case', async ({ page }) => {
      // Create profile and trip
      await userPeoplePage.createOrUpdateProfile({
        name: 'Edge Case User',
        age: 31,
      });

      await tripManager.createFirstTrip({
        template: 'business',
        title: 'Edge Case Trip',
        skipDates: true,
      });

      // Verify profile is in trip
      await peoplePage.goto();
      await expect(page.getByText('Edge Case User')).toBeVisible();

      // Since profiles can't be deleted (only edited), this tests that the constraint works
      await userPeoplePage.expectProfileCannotBeDeleted();
    });

    test('profile auto-addition works with different trip templates', async ({
      page,
    }) => {
      await userPeoplePage.createOrUpdateProfile({
        name: 'Template Test User',
        age: 30,
      });

      // Test with business template
      await tripManager.createFirstTrip({
        template: 'business',
        title: 'Business Template Trip',
        skipDates: true,
      });

      await peoplePage.goto();
      await expect(page.getByText('Template Test User')).toBeVisible();

      // Test with vacation template
      await tripManager.createAdditionalTrip({
        template: 'vacation',
        title: 'Vacation Template Trip',
        skipDates: true,
      });

      await peoplePage.goto();
      await expect(page.getByText('Template Test User')).toBeVisible();

      // Test with weekend template
      await tripManager.createAdditionalTrip({
        template: 'weekend',
        title: 'Weekend Template Trip',
        skipDates: true,
      });

      await peoplePage.goto();
      await expect(page.getByText('Template Test User')).toBeVisible();
    });
  });
});
