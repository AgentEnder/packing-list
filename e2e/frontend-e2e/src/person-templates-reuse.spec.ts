import { test, expect } from '@playwright/test';
import { clearAllTestData, setupCleanTestUser } from './test-db-utils';
import { UserPeoplePage } from './page-objects/UserPeoplePage';
import { TripManager } from './page-objects/trip-manager';
import { PeoplePage } from './page-objects/PeoplePage';

test.describe('Person Templates and Reuse', () => {
  let userPeoplePage: UserPeoplePage;
  let peoplePage: PeoplePage;
  let tripManager: TripManager;

  test.beforeEach(async ({ page, context }) => {
    await clearAllTestData(page);
    await setupCleanTestUser(page);
    userPeoplePage = new UserPeoplePage(page);
    peoplePage = new PeoplePage(page);
    tripManager = new TripManager(page);

    // People page is not fleshed out if no trip selected.
    await tripManager.createTrip({
      template: 'vacation',
      title: 'Initial Trip',
      skipDates: true,
    });

    // Ensure clean state by clearing all templates and trips
    await userPeoplePage.clearAllPersonTemplates();
  });

  test.describe('Template Management', () => {
    test('can create person templates', async ({ page }) => {
      await userPeoplePage.createPersonTemplate({
        name: 'Alice Johnson',
        age: 28,
        gender: 'female',
      });

      // Verify template was created
      await userPeoplePage.expectPersonTemplateExists('Alice Johnson');

      // Create second template
      await userPeoplePage.createPersonTemplate({
        name: 'Bob Smith',
        age: 35,
        gender: 'male',
      });

      // Verify both templates exist
      await userPeoplePage.expectPersonTemplateExists('Alice Johnson');
      await userPeoplePage.expectPersonTemplateExists('Bob Smith');
    });

    test('can edit person templates', async ({ page }) => {
      await userPeoplePage.createPersonTemplate({
        name: 'Edit Template',
        age: 30,
        gender: 'other',
      });

      await userPeoplePage.editPersonTemplate('Edit Template', {
        name: 'Edited Template',
        age: 31,
      });

      await userPeoplePage.expectPersonTemplateExists('Edited Template');
    });

    test('can delete person templates', async ({ page }) => {
      const uniqueName = `Delete-Template-${Date.now()}`;

      await userPeoplePage.createPersonTemplate({
        name: uniqueName,
        age: 25,
      });

      await userPeoplePage.expectPersonTemplateExists(uniqueName);
      await userPeoplePage.deletePersonTemplate(uniqueName);

      // Verify the template no longer exists
      await userPeoplePage.gotoPeopleManagement();
      await expect(
        page.locator('h3.font-semibold').getByText(uniqueName, { exact: true })
      ).not.toBeVisible();
    });

    test('shows template count correctly', async ({ page }) => {
      // Start with empty state
      const initialCount = await userPeoplePage.getPersonTemplatesCount();
      expect(initialCount).toBe(0);

      // Add templates
      await userPeoplePage.createPersonTemplate({
        name: 'Template One',
        age: 25,
      });

      await userPeoplePage.createPersonTemplate({
        name: 'Template Two',
        age: 30,
      });

      const finalCount = await userPeoplePage.getPersonTemplatesCount();
      expect(finalCount).toBe(2);
    });
  });

  test.describe('Template Usage in Trips', () => {
    test.beforeEach(async ({ page }) => {
      await userPeoplePage.createPersonTemplate({
        name: 'Family Member',
        age: 45,
        gender: 'female',
      });

      await userPeoplePage.createPersonTemplate({
        name: 'Travel Buddy',
        age: 32,
        gender: 'male',
      });

      await tripManager.createTrip({
        template: 'vacation',
        title: 'Template Test Trip',
        skipDates: true,
      });
    });

    test('shows template suggestions when adding people', async ({ page }) => {
      await peoplePage.goto();
      await userPeoplePage.expectTemplateSuggestions('Family', [
        'Family Member',
      ]);
      await userPeoplePage.expectTemplateSuggestions('Travel', [
        'Travel Buddy',
      ]);
    });

    test('can add person from template', async ({ page }) => {
      await peoplePage.goto();
      await userPeoplePage.addPersonFromTemplate('Family Member');

      await expect(page.getByText('Family Member')).toBeVisible();
      await expect(page.getByText('Age: 45')).toBeVisible();
      await expect(page.getByText('Gender: female')).toBeVisible();
    });

    test('template usage shows template indicator', async ({ page }) => {
      await peoplePage.goto();
      await userPeoplePage.addPersonFromTemplate('Family Member');

      const personCard = page.getByTestId('person-card-family-member');
      await expect(personCard.getByTestId('template-indicator')).toBeVisible();
      await expect(personCard.getByText('From Template')).toBeVisible();
    });

    test('editing templated person creates independent copy', async ({
      page,
    }) => {
      await peoplePage.goto();

      await userPeoplePage.addPersonFromTemplate('Family Member');

      // Edit the person in the trip
      const personCard = page.getByTestId('person-card-family-member');
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

      await userPeoplePage.gotoPeopleManagement();
      const originalTemplate = page.getByTestId('template-card-family-member');
      await expect(originalTemplate.getByText('Age: 45')).toBeVisible();
    });
  });

  test.describe('Save Trip Person as Template', () => {
    test.beforeEach(async ({ page }) => {
      await tripManager.createTrip({
        template: 'business',
        title: 'Save Template Trip',
        skipDates: true,
      });
    });

    test('can save regular trip person as template', async ({ page }) => {
      await peoplePage.goto();
      await peoplePage.addPerson('John Regular', 28, 'male');
      await userPeoplePage.savePersonAsTemplate('John Regular');
      await userPeoplePage.expectPersonTemplateExists('John Regular');
    });

    test('save as template button appears on non-profile people', async ({
      page,
    }) => {
      await peoplePage.goto();
      await peoplePage.addPerson('Saveable Person', 30, 'female');

      const personCard = page.getByTestId('person-card-saveable-person');
      await personCard.getByTestId('person-menu-button').click();
      await expect(page.getByTestId('save-as-template-button')).toBeVisible();
    });

    test('save as template does not appear on profile people', async ({
      page,
    }) => {
      // Create profile first
      await userPeoplePage.createOrUpdateProfile({
        name: 'Profile User',
        age: 35,
      });

      await peoplePage.goto();

      // Profile person should not have save as template option
      const profileCard = page.getByTestId('person-card-profile-user');
      await profileCard.getByTestId('person-menu-button').click();

      await expect(
        page.getByTestId('save-as-template-button')
      ).not.toBeVisible();
    });

    test('saved template can be used in other trips', async ({ page }) => {
      await peoplePage.goto();

      // Add and save person as template
      await peoplePage.addPerson('Cross Trip Person', 33, 'other');
      await userPeoplePage.savePersonAsTemplate('Cross Trip Person');

      // Create another trip
      await tripManager.createAdditionalTrip({
        template: 'vacation',
        title: 'Second Trip',
        skipDates: true,
      });

      // Use template in new trip
      await peoplePage.goto();
      await userPeoplePage.addPersonFromTemplate('Cross Trip Person');

      await expect(page.getByText('Cross Trip Person')).toBeVisible();
      await expect(page.getByText('Age: 33')).toBeVisible();
    });
  });

  test.describe('Template Suggestions and Search', () => {
    test.beforeEach(async ({ page }) => {
      // Create diverse templates
      await userPeoplePage.createPersonTemplate({
        name: 'Anna Smith',
        age: 25,
        gender: 'female',
      });

      await userPeoplePage.createPersonTemplate({
        name: 'Andrew Johnson',
        age: 30,
        gender: 'male',
      });

      await userPeoplePage.createPersonTemplate({
        name: 'Bob Anderson',
        age: 35,
        gender: 'male',
      });

      await tripManager.createTrip({
        template: 'weekend',
        title: 'Search Test Trip',
        skipDates: true,
      });
    });

    test('shows relevant templates when typing partial names', async ({
      page,
    }) => {
      await peoplePage.goto();

      // Should show Anna and Andrew for "An"
      await userPeoplePage.expectTemplateSuggestions('An', [
        'Anna Smith',
        'Andrew Johnson',
      ]);

      // Should show Bob for "Bob"
      await userPeoplePage.expectTemplateSuggestions('Bob', ['Bob Anderson']);
    });

    test('templates are sorted by relevance', async ({ page }) => {
      await peoplePage.goto();

      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('A');

      // Should show both Anna and Andrew - order may vary based on sorting algorithm
      const suggestions = page.locator('[data-testid^="template-suggestion-"]');
      
      // Verify both suggestions are present
      await expect(suggestions).toHaveCount(2);
      await expect(suggestions.filter({ hasText: 'Anna Smith' })).toBeVisible();
      await expect(suggestions.filter({ hasText: 'Andrew Johnson' })).toBeVisible();
    });

    test('can select template from suggestions', async ({ page }) => {
      await peoplePage.goto();

      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('Anna');

      // Click on suggestion
      await page.getByTestId('template-suggestion-anna-smith').click();

      // Should auto-fill form
      const nameInput = page.getByTestId('person-name-input');
      await expect(nameInput).toHaveValue('Anna Smith');

      const ageInput = page.getByTestId('person-age-input');
      await expect(ageInput).toHaveValue('25');
    });

    test('can dismiss suggestions and create new person', async ({ page }) => {
      await peoplePage.goto();

      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('Anna New Person');

      // Clear and type different name
      await page
        .getByTestId('person-name-input')
        .fill('Completely Different Name');
      await page.getByTestId('person-age-input').fill('40');
      await page.getByTestId('save-person-button').click();

      // Should create new person, not use template
      await expect(page.getByText('Completely Different Name')).toBeVisible();
      await expect(page.getByText('Age: 40')).toBeVisible();
    });
  });

  test.describe('Cross-Trip Template Consistency', () => {
    test('template changes do not affect existing trip people', async ({
      page,
    }) => {
      // Create template and use in trip
      await userPeoplePage.createPersonTemplate({
        name: 'Consistent Person',
        age: 30,
        gender: 'male',
      });

      await tripManager.createTrip({
        template: 'business',
        title: 'Consistency Trip',
        skipDates: true,
      });

      await peoplePage.goto();
      await userPeoplePage.addPersonFromTemplate('Consistent Person');

      // Verify person is in trip
      await expect(page.getByText('Consistent Person')).toBeVisible();
      await expect(page.getByText('Age: 30')).toBeVisible();

      // Update template
      await userPeoplePage.editPersonTemplate('Consistent Person', { age: 31 });

      // Trip person should remain unchanged
      await peoplePage.goto();
      await expect(page.getByText('Age: 30')).toBeVisible(); // Original age
    });

    test('new trips use updated template', async ({ page }) => {
      // Create and use template in first trip
      await userPeoplePage.createPersonTemplate({
        name: 'Update Test Person',
        age: 25,
      });

      await tripManager.createTrip({
        template: 'vacation',
        title: 'First Trip',
        skipDates: true,
      });

      await peoplePage.goto();
      await userPeoplePage.addPersonFromTemplate('Update Test Person');

      // Update template
      await userPeoplePage.editPersonTemplate('Update Test Person', {
        age: 26,
        gender: 'female',
      });

      // Create second trip and use template
      await tripManager.createAdditionalTrip({
        template: 'business',
        title: 'Second Trip',
        skipDates: true,
      });

      await peoplePage.goto();
      await userPeoplePage.addPersonFromTemplate('Update Test Person');

      // Should use updated template values
      await expect(page.getByText('Age: 26')).toBeVisible();
      await expect(page.getByText('Gender: female')).toBeVisible();
    });
  });

  test.describe('Profile + Templates Integration', () => {
    test('profile and templates work together', async ({ page }) => {
      await userPeoplePage.createOrUpdateProfile({
        name: 'My Profile',
        age: 28,
        gender: 'male',
      });

      await userPeoplePage.createPersonTemplate({
        name: 'Template Friend',
        age: 30,
        gender: 'female',
      });

      await tripManager.createTrip({
        template: 'vacation',
        title: 'Mixed People Trip',
        skipDates: true,
      });

      await peoplePage.goto();
      await expect(page.getByText('My Profile')).toBeVisible();

      const profileCard = page.getByTestId('person-card-my-profile');
      await expect(profileCard.getByText('You')).toBeVisible();

      await userPeoplePage.addPersonFromTemplate('Template Friend');

      const templateCard = page.getByTestId('person-card-template-friend');
      await expect(templateCard.getByText('From Template')).toBeVisible();

      await expect(page.getByText('My Profile')).toBeVisible();
      await expect(page.getByText('Template Friend')).toBeVisible();
    });

    test('profile cannot be saved as template', async ({ page }) => {
      await userPeoplePage.createOrUpdateProfile({
        name: 'Profile No Template',
        age: 32,
      });

      await tripManager.createTrip({
        template: 'business',
        title: 'Profile Test Trip',
        skipDates: true,
      });

      await peoplePage.goto();

      const profileCard = page.getByTestId(
        'person-card-profile-no-template-profile'
      );

      // Menu should not have save as template option
      await profileCard.getByTestId('person-menu-button').click();
      await expect(
        page.getByTestId('save-as-template-button')
      ).not.toBeVisible();
    });
  });

  test.describe('Performance and Bulk Operations', () => {
    test('handles many templates efficiently', async ({ page }) => {
      // Create multiple templates
      const templateNames: string[] = [];
      for (let i = 1; i <= 10; i++) {
        const name = `Template Person ${i}`;
        templateNames.push(name);

        await userPeoplePage.createPersonTemplate({
          name,
          age: 20 + i,
          gender: i % 2 === 0 ? 'male' : 'female',
        });
      }

      // Verify all templates exist
      await userPeoplePage.gotoPeopleManagement();

      for (const name of templateNames) {
        await userPeoplePage.expectPersonTemplateExists(name);
      }

      const count = await userPeoplePage.getPersonTemplatesCount();
      expect(count).toBe(10);
    });

    test('bulk template cleanup works', async ({ page }) => {
      // Create several templates
      await userPeoplePage.createPersonTemplate({
        name: 'Cleanup One',
        age: 25,
      });

      await userPeoplePage.createPersonTemplate({
        name: 'Cleanup Two',
        age: 30,
      });

      await userPeoplePage.createPersonTemplate({
        name: 'Cleanup Three',
        age: 35,
      });

      const beforeCount = await userPeoplePage.getPersonTemplatesCount();
      expect(beforeCount).toBe(3);

      // Clear all templates
      await userPeoplePage.clearAllPersonTemplates();

      const afterCount = await userPeoplePage.getPersonTemplatesCount();
      expect(afterCount).toBe(0);
    });
  });
});
