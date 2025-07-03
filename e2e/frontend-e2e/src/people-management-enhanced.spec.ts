import { test, expect } from '@playwright/test';
import { clearAllTestData, setupCleanTestUser } from './test-db-utils';
import { TripManager } from './page-objects/trip-manager';
import { UserPeoplePage } from './page-objects/UserPeoplePage';
import { PeoplePage } from './page-objects/PeoplePage';

test.describe('Enhanced People Management with Reusable Features', () => {
  let tripManager: TripManager;
  let userPeoplePage: UserPeoplePage;
  let peoplePage: PeoplePage;

  test.describe('Trip People with Profile Integration', () => {
    test.beforeEach(async ({ page }) => {
      await clearAllTestData(page);
      await setupCleanTestUser(page);
      tripManager = new TripManager(page);
      userPeoplePage = new UserPeoplePage(page);
      peoplePage = new PeoplePage(page);

      // Create profile first
      await userPeoplePage.createOrUpdateProfile({
        name: 'Test User Profile',
        age: 30,
        gender: 'male',
      });

      try {
        // Create a trip - profile should auto-appear
        await tripManager.createTrip({
          template: 'business',
          title: 'Enhanced Test Trip',
          skipDates: true,
        });
      } catch {
        // There was probably an existing trip.
      }

      await page.getByRole('link', { name: 'People' }).click();
    });

    test('shows profile user with special indicator', async ({ page }) => {
      // Profile should be auto-added
      await expect(page.getByText('Test User Profile')).toBeVisible();

      // Should have profile indicator
      const profileCard = page.getByTestId('person-card-test-user-profile');
      await expect(profileCard.getByTestId('profile-indicator')).toBeVisible();
      await expect(profileCard.getByText('You')).toBeVisible();
    });

    test('can add regular people alongside profile', async ({ page }) => {
      // Add regular person
      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('Regular Person');
      await page.getByTestId('person-age-input').fill('25');
      await page.getByTestId('person-gender-select').selectOption('female');
      await page.getByTestId('save-person-button').click();

      // Both should be visible
      await expect(page.getByText('Test User Profile')).toBeVisible();
      await expect(page.getByText('Regular Person')).toBeVisible();

      // Profile should have "You" indicator, regular person should not
      const profileCard = page.getByTestId('person-card-test-user-profile');
      const regularCard = page.getByTestId('person-card-regular-person');

      await expect(profileCard.getByText('You')).toBeVisible();
      await expect(regularCard.getByText('You')).not.toBeVisible();
    });

    test('profile person cannot be deleted from trip', async ({ page }) => {
      const profileCard = page.getByTestId('person-card-test-user-profile');

      // Open the menu to check available buttons
      await profileCard.getByTestId('person-menu-button').click();

      // Should not have delete button
      await expect(
        profileCard.getByTestId('delete-person-button')
      ).not.toBeVisible();

      // Should have view/edit button that redirects to profile
      await expect(
        profileCard.getByTestId('view-profile-button')
      ).toBeVisible();
    });

    test('editing profile person redirects to profile page', async ({
      page,
    }) => {
      const profileCard = page.getByTestId('person-card-test-user-profile');
      await profileCard.getByTestId('person-menu-button').click();
      await profileCard.getByTestId('view-profile-button').click();

      // Should redirect to profile page
      await expect(page).toHaveURL(/\/profile\/?$/);
      await expect(page.getByTestId('profile-name-input')).toBeVisible();
    });

    // This test is for behavior that is not yet implemented, but I'm leaving
    // it here as a placeholder for future work.
    test.skip('profile changes reflect immediately in trip people', async ({
      page,
    }) => {
      // Update profile
      await userPeoplePage.createOrUpdateProfile({
        name: 'Updated Profile Name',
        age: 31,
        gender: 'female',
      });

      // Go back to people page
      await page.getByRole('link', { name: 'People' }).click();

      // Should show updated information
      await expect(page.getByText('Updated Profile Name')).toBeVisible();
      await expect(page.getByText('Age: 31')).toBeVisible();
      await expect(page.getByText('Gender: female')).toBeVisible();
    });
  });

  test.describe('People Management with Templates', () => {
    test.beforeEach(async ({ page }) => {
      await clearAllTestData(page);
      await setupCleanTestUser(page);
      tripManager = new TripManager(page);
      userPeoplePage = new UserPeoplePage(page);
      peoplePage = new PeoplePage(page);

      // Create trip
      await tripManager.createTrip({
        template: 'vacation',
        title: 'Template Integration Trip',
        skipDates: true,
      });

      // Create some person templates
      await userPeoplePage.createPersonTemplate({
        name: 'Family Member',
        age: 45,
        gender: 'female',
      });

      await userPeoplePage.createPersonTemplate({
        name: 'Work Colleague',
        age: 35,
        gender: 'male',
      });

      await page.getByRole('link', { name: 'People' }).click();
    });

    test('shows template suggestions when typing person names', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Add Person' }).click();

      // Type partial name
      await page.getByTestId('person-name-input').fill('Family');

      // Should show template suggestion
      const suggestion = page.getByTestId('template-suggestion-family-member');
      await expect(suggestion).toBeVisible();
      await expect(suggestion).toContainText('Family Member');
      await expect(suggestion).toContainText('Age: 45');
    });

    test('can quickly add person from template', async ({ page }) => {
      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('Family');

      // Click template suggestion
      await page.getByTestId('template-suggestion-family-member').click();

      // Should auto-fill form
      const nameInput = page.getByTestId('person-name-input');
      const ageInput = page.getByTestId('person-age-input');
      const genderSelect = page.getByTestId('person-gender-select');

      await expect(nameInput).toHaveValue('Family Member');
      await expect(ageInput).toHaveValue('45');
      await expect(genderSelect).toHaveValue('female');

      // Save the person
      await page.getByTestId('save-person-button').click();

      // Should appear in trip people list
      await expect(page.getByText('Family Member')).toBeVisible();
      await expect(page.getByText('Age: 45')).toBeVisible();
    });

    test('can save new person as template for future use', async ({ page }) => {
      // Add a new person first
      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('New Travel Buddy');
      await page.getByTestId('person-age-input').fill('28');
      await page.getByTestId('person-gender-select').selectOption('other');
      await page.getByTestId('save-person-button').click();

      // Wait for the person card to be fully rendered and stable
      await page.waitForTimeout(500);

      // Now save the person as template using the PersonCard menu
      const personCard = page.getByTestId('person-card-new-travel-buddy');
      await personCard.getByTestId('person-menu-button').click();
      await page.getByTestId('save-as-template-button').click();

      // Verify template was created by checking it exists in the management page
      await userPeoplePage.expectPersonTemplateExists('New Travel Buddy');
    });

    test('template-derived people show template indicator', async ({
      page,
    }) => {
      // Add person from template
      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('Work');
      await page.getByTestId('template-suggestion-work-colleague').click();
      await page.getByTestId('save-person-button').click();

      // Should show template indicator
      const personCard = page.getByTestId('person-card-work-colleague');
      await expect(personCard.getByTestId('template-indicator')).toBeVisible();
      await expect(personCard.getByText('From Template')).toBeVisible();
    });

    test('editing template-derived person creates independent copy', async ({
      page,
    }) => {
      // Add and edit person from template
      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('Family');
      await page.getByTestId('template-suggestion-family-member').click();
      await page.getByTestId('save-person-button').click();

      // Wait for the person card to be fully rendered and stable
      await page.waitForTimeout(500);

      // Edit the person
      const personCard = page.getByTestId('person-card-family-member');
      await personCard.getByTestId('person-menu-button').click();
      await personCard.getByTestId('edit-person-button').click();

      await page
        .getByTestId('person-name-input')
        .fill('Modified Family Member');
      await page.getByTestId('person-age-input').fill('46');
      await page.getByTestId('save-person-button').click();

      // Trip person should be updated
      await expect(page.getByText('Modified Family Member')).toBeVisible();
      await expect(page.getByText('Age: 46')).toBeVisible();

      // Original template should remain unchanged
      await userPeoplePage.expectPersonTemplateExists('Family Member');
    });
  });

  test.describe('Complex Scenarios', () => {
    test.beforeEach(async ({ page }) => {
      await clearAllTestData(page);
      await setupCleanTestUser(page);
      tripManager = new TripManager(page);
      userPeoplePage = new UserPeoplePage(page);
      peoplePage = new PeoplePage(page);
    });

    test('profile + templates + regular people all work together', async ({
      page,
    }) => {
      // Create profile
      await userPeoplePage.createOrUpdateProfile({
        name: 'My Profile',
        age: 30,
        gender: 'male',
      });

      // Create template
      await userPeoplePage.createPersonTemplate({
        name: 'Template Person',
        age: 25,
        gender: 'female',
      });

      // Create trip
      await tripManager.createTrip({
        template: 'vacation',
        title: 'Complex Scenario Trip',
        skipDates: true,
      });

      await peoplePage.goto();

      // Profile should auto-appear
      const profileCard = page.getByTestId('person-card-my-profile');
      await expect(profileCard.getByText('You')).toBeVisible();
      await expect(profileCard.getByText('My Profile')).toBeVisible();

      // Add person from template
      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('Template');
      await page.getByTestId('template-suggestion-template-person').click();
      await page.getByTestId('save-person-button').click();

      const templateCard = page.getByTestId('person-card-template-person');
      await expect(templateCard.getByText('From Template')).toBeVisible();

      // Add regular person
      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('Regular Person');
      await page.getByTestId('person-age-input').fill('35');
      await page.getByTestId('save-person-button').click();
      const regularPersonCard = page.getByTestId('person-card-regular-person');

      // All three types should be visible with correct indicators
      await expect(profileCard.getByText('My Profile')).toBeVisible();
      await expect(templateCard.getByText('Template Person')).toBeVisible();
      await expect(regularPersonCard.getByText('Regular Person')).toBeVisible();

      // Each should have appropriate indicators
      await expect(profileCard.getByText('You')).toBeVisible();
      await expect(templateCard.getByText('From Template')).toBeVisible();

      await expect(regularPersonCard.getByText('You')).not.toBeVisible();
      await expect(
        regularPersonCard.getByText('From Template')
      ).not.toBeVisible();
    });

    test('works across multiple trips', async ({ page }) => {
      // Create profile and template
      await userPeoplePage.createOrUpdateProfile({
        name: 'Multi Trip User',
        age: 28,
      });

      await userPeoplePage.createPersonTemplate({
        name: 'Frequent Traveler',
        age: 32,
        gender: 'other',
      });

      // Create first trip
      await tripManager.createTrip({
        template: 'business',
        title: 'First Trip',
        skipDates: true,
      });

      await page.getByRole('link', { name: 'People' }).click();

      // Profile should be auto-added
      await expect(page.getByText('Multi Trip User')).toBeVisible();

      // Add person from template
      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('Frequent');
      await page.getByTestId('template-suggestion-frequent-traveler').click();
      await page.getByTestId('save-person-button').click();

      // Create second trip
      await tripManager.createAdditionalTrip({
        template: 'vacation',
        title: 'Second Trip',
        skipDates: true,
      });

      await page.getByRole('link', { name: 'People' }).click();

      // Profile should be auto-added to second trip too
      await expect(page.getByText('Multi Trip User')).toBeVisible();

      // Template should be available for reuse
      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('Frequent');

      const suggestion = page.getByTestId(
        'template-suggestion-frequent-traveler'
      );
      await expect(suggestion).toBeVisible();
    });
  });
});
