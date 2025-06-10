import { test, expect } from '@playwright/test';
import { setupTestSession } from './utils';
import { TripManager } from './page-objects/trip-manager';

test.describe('People Management', () => {
  let tripManager: TripManager;

  test.describe('No Trip Selected State', () => {
    test.beforeEach(async ({ page, context }) => {
      await setupTestSession(page, context, 'fresh');
      tripManager = new TripManager(page);
    });

    test('shows no trip selected state on people page', async ({ page }) => {
      await page.getByRole('link', { name: 'People' }).click();
      await tripManager.expectNoTripSelected();
    });

    test('can load demo from no trip state', async ({ page }) => {
      await page.getByRole('link', { name: 'People' }).click();

      // Click demo button
      await page.getByRole('button', { name: 'Try Demo Trip' }).click();

      // Instead of looking for hidden trip title text, check for demo banner which is always visible
      await expect(
        page.getByText("You're currently using demo data")
      ).toBeVisible({ timeout: 10000 });

      // Navigate to people page to verify demo data loaded
      await page.getByRole('link', { name: 'People' }).click();

      // Verify demo banner is still there (more reliable than hidden trip selector text)
      await expect(
        page.getByText("You're currently using demo data")
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('With Created Trip', () => {
    test.beforeEach(async ({ page, context }) => {
      await setupTestSession(page, context, 'fresh');
      tripManager = new TripManager(page);

      // Create a trip first using TripManager
      await tripManager.createFirstTrip({
        template: 'business',
        title: 'Test Trip',
        skipDates: true,
      });

      // Navigate to people page
      await page.getByRole('link', { name: 'People' }).click();
    });

    test('shows empty state when no people added', async ({ page }) => {
      await expect(page.getByText('No people added yet')).toBeVisible();
    });

    test('can add a person with full details', async ({ page }) => {
      await page.getByRole('button', { name: 'Add Person' }).click();

      // Use proper test IDs and correct field types
      await page.getByTestId('person-name-input').fill('John Doe');
      await page.getByTestId('person-age-input').fill('30');
      await page.getByTestId('person-gender-select').selectOption('male');

      await page.getByTestId('save-person-button').click();

      // Verify person was added
      await expect(page.getByText('John Doe')).toBeVisible();
      await expect(page.getByText('Age: 30')).toBeVisible();
      await expect(page.getByText('Gender: male')).toBeVisible();
    });

    test('can add a person with minimal details', async ({ page }) => {
      await page.getByRole('button', { name: 'Add Person' }).click();

      await page.getByTestId('person-name-input').fill('Jane Smith');
      await page.getByTestId('person-age-input').fill('25');

      await page.getByTestId('save-person-button').click();

      await expect(page.getByText('Jane Smith')).toBeVisible();
      await expect(page.getByText('Age: 25')).toBeVisible();
    });

    test('can edit a person', async ({ page }) => {
      // Add a person first
      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('Bob Johnson');
      await page.getByTestId('person-age-input').fill('40');
      await page.getByTestId('save-person-button').click();

      // Edit the person
      await page.getByTestId('edit-person-button').click();
      await page.getByTestId('person-name-input').fill('Robert Johnson');
      await page.getByTestId('person-age-input').fill('41');
      await page.getByTestId('save-person-button').click();

      await expect(page.getByText('Robert Johnson')).toBeVisible();
      await expect(page.getByText('Age: 41')).toBeVisible();
    });

    test('can delete a person', async ({ page }) => {
      // Add a person first
      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('Delete Me');
      await page.getByTestId('person-age-input').fill('35');
      await page.getByTestId('save-person-button').click();

      // Delete the person
      await page.getByTestId('delete-person-button').click();

      await expect(page.getByText('Delete Me')).not.toBeVisible();
      await expect(page.getByText('No people added yet')).toBeVisible();
    });

    test('validates required name field', async ({ page }) => {
      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-age-input').fill('25');

      // Try to submit without name
      await page.getByTestId('save-person-button').click();

      // Form should not submit and we should still be in edit mode
      await expect(page.getByTestId('person-name-input')).toBeVisible();
    });

    test('validates required age field', async ({ page }) => {
      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('Test Person');

      // Try to submit without age
      await page.getByTestId('save-person-button').click();

      // Form should not submit and we should still be in edit mode
      await expect(page.getByTestId('person-age-input')).toBeVisible();
    });

    test('can cancel adding a person', async ({ page }) => {
      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByTestId('person-name-input').fill('Cancelled Person');

      await page.getByTestId('cancel-person-button').click();

      await expect(page.getByText('Cancelled Person')).not.toBeVisible();
      await expect(page.getByText('No people added yet')).toBeVisible();
    });
  });
});
