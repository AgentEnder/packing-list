import { test, expect } from '@playwright/test';
import { setupTestSession } from './utils.js';

test.describe('People Management', () => {
  test.beforeEach(async ({ page, context }) => {
    await setupTestSession(page, context, false);
    await page.getByRole('link', { name: 'People' }).click();
  });

  test('shows empty state when no people added', async ({ page }) => {
    await expect(page.getByText('No people added yet.')).toBeVisible();
  });

  test('can add a person with full details', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Person' }).click();

    // Fill all fields
    await page.getByRole('textbox', { name: 'Name' }).fill('John Doe');
    await page.getByRole('spinbutton', { name: 'Age' }).fill('30');
    await page.getByRole('combobox', { name: 'Gender' }).selectOption('male');
    await page.getByRole('button', { name: 'Add Person' }).click();

    // Verify person card
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Age: 30')).toBeVisible();
    await expect(page.getByText('Gender: male').first()).toBeVisible();
  });

  test('can add multiple people', async ({ page }) => {
    const people = [
      { name: 'John Doe', age: '30', gender: 'male' },
      { name: 'Jane Doe', age: '28', gender: 'female' },
      { name: 'Billy Kid', age: '5', gender: 'male' },
    ];

    for (const person of people) {
      await page.getByRole('button', { name: 'Add Person' }).click();
      await page.getByRole('textbox', { name: 'Name' }).fill(person.name);
      await page.getByRole('spinbutton', { name: 'Age' }).fill(person.age);
      await page
        .getByRole('combobox', { name: 'Gender' })
        .selectOption(person.gender);
      await page.getByRole('button', { name: 'Add Person' }).click();
    }

    // Verify all people are shown
    for (const person of people) {
      await expect(page.getByText(person.name)).toBeVisible();
      await expect(page.getByText(`Age: ${person.age}`)).toBeVisible();
      await expect(
        page.getByText(`Gender: ${person.gender}`).first()
      ).toBeVisible();
    }
  });

  test('can delete a person', async ({ page }) => {
    // Add person first
    await page.getByRole('button', { name: 'Add Person' }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill('To Delete');
    await page.getByRole('spinbutton', { name: 'Age' }).fill('25');
    await page.getByRole('button', { name: 'Add Person' }).click();

    // Delete person
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('To Delete')).not.toBeVisible();
    await expect(page.getByText('No people added yet.')).toBeVisible();
  });

  test('validates required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Person' }).click();
    await page.getByRole('button', { name: 'Add Person' }).click();

    // Verify error messages
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveAttribute(
      'required'
    );
    await expect(page.getByRole('spinbutton', { name: 'Age' })).toHaveAttribute(
      'required'
    );
  });

  test('validates age field format', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Person' }).click();

    // Fill name
    await page.getByRole('textbox', { name: 'Name' }).fill('Test Person');

    // Try negative age
    await page.getByRole('spinbutton', { name: 'Age' }).fill('-1');
    await page.getByRole('button', { name: 'Add Person' }).click();

    // Verify age input has min attribute
    await expect(page.getByRole('spinbutton', { name: 'Age' })).toHaveAttribute(
      'min',
      '0'
    );
  });

  test('can cancel adding a person', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Person' }).click();

    // Fill some fields
    await page.getByRole('textbox', { name: 'Name' }).fill('To Cancel');
    await page.getByRole('spinbutton', { name: 'Age' }).fill('25');

    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Verify form is closed and person wasn't added
    await expect(page.getByText('To Cancel')).not.toBeVisible();
    await expect(page.getByText('No people added yet.')).toBeVisible();
  });
});
