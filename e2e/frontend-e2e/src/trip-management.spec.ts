import { test, expect } from '@playwright/test';

test.describe('Trip Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show trip selector when no trips exist', async ({ page }) => {
    // Should show empty state in trip selector
    await expect(page.getByTestId('trip-selector-empty')).toBeVisible();
    await expect(page.getByText('Create Your First Trip')).toBeVisible();
  });

  test('should create a new trip', async ({ page }) => {
    // Click on create first trip
    await page.getByTestId('create-first-trip-link').click();

    // Should navigate to trip creation page
    await expect(page).toHaveURL('/trips/new');
    await expect(page.getByText('Create New Trip')).toBeVisible();

    // Select a template
    await page.getByTestId('template-vacation').click();

    // Should move to details step
    await expect(page.getByText('Trip Details')).toBeVisible();
    await expect(page.getByTestId('trip-title-input')).toHaveValue('Vacation');

    // Fill in trip details
    await page.getByTestId('trip-title-input').fill('Summer Vacation 2024');
    await page
      .getByTestId('trip-description-input')
      .fill('Family trip to the beach');
    await page.getByTestId('trip-location-input').fill('Hawaii');

    // Submit the form
    await page.getByTestId('create-trip-submit').click();

    // Should navigate back to home and show the new trip
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('trip-selector')).toBeVisible();
    await expect(page.getByText('Summer Vacation 2024')).toBeVisible();
  });

  test('should manage multiple trips', async ({ page }) => {
    // Create first trip
    await page.getByTestId('create-first-trip-link').click();
    await page.getByTestId('template-business').click();
    await page.getByTestId('trip-title-input').fill('Business Trip NYC');
    await page.getByTestId('create-trip-submit').click();

    // Navigate to trips page
    await page.getByTestId('trip-selector').click();
    await page.getByTestId('manage-trips-link').click();

    // Should show trips management page
    await expect(page).toHaveURL('/trips');
    await expect(page.getByText('Business Trip NYC')).toBeVisible();

    // Create another trip
    await page.getByText('New Trip').click();
    await page.getByTestId('template-weekend').click();
    await page.getByTestId('trip-title-input').fill('Weekend Getaway');
    await page.getByTestId('create-trip-submit').click();

    // Go back to trips page
    await page.getByTestId('trip-selector').click();
    await page.getByTestId('manage-trips-link').click();

    // Should show both trips
    await expect(page.getByText('Business Trip NYC')).toBeVisible();
    await expect(page.getByText('Weekend Getaway')).toBeVisible();

    // Current trip should be marked
    await expect(page.getByText('Current')).toBeVisible();
  });

  test('should switch between trips', async ({ page }) => {
    // Create two trips first
    await page.getByTestId('create-first-trip-link').click();
    await page.getByTestId('template-business').click();
    await page.getByTestId('trip-title-input').fill('Trip A');
    await page.getByTestId('create-trip-submit').click();

    await page.getByTestId('trip-selector').click();
    await page.getByTestId('create-trip-link').click();
    await page.getByTestId('template-vacation').click();
    await page.getByTestId('trip-title-input').fill('Trip B');
    await page.getByTestId('create-trip-submit').click();

    // Current trip should be Trip B
    await expect(page.getByTestId('trip-selector')).toContainText('Trip B');

    // Switch to Trip A
    await page.getByTestId('trip-selector').click();
    await page.getByTestId('trip-option-trip-').first().click();

    // Should close selector and show Trip A as current
    await expect(page.getByTestId('trip-selector')).toContainText('Trip A');
  });

  test('should delete a trip', async ({ page }) => {
    // Create a trip first
    await page.getByTestId('create-first-trip-link').click();
    await page.getByTestId('template-business').click();
    await page.getByTestId('trip-title-input').fill('Trip to Delete');
    await page.getByTestId('create-trip-submit').click();

    // Go to trips management
    await page.getByTestId('trip-selector').click();
    await page.getByTestId('manage-trips-link').click();

    // Open trip menu and delete
    await page.getByTestId('trip-menu-trip-').first().click();
    await page.getByTestId('delete-trip-trip-').first().click();

    // Confirm deletion
    await expect(page.getByText('Delete Trip')).toBeVisible();
    await page.getByTestId('confirm-delete-trip').click();

    // Trip should be removed
    await expect(page.getByText('Trip to Delete')).not.toBeVisible();
    await expect(page.getByText('No trips yet')).toBeVisible();
  });

  test('should duplicate a trip', async ({ page }) => {
    // Create a trip first
    await page.getByTestId('create-first-trip-link').click();
    await page.getByTestId('template-vacation').click();
    await page.getByTestId('trip-title-input').fill('Original Trip');
    await page.getByTestId('create-trip-submit').click();

    // Go to trips management
    await page.getByTestId('trip-selector').click();
    await page.getByTestId('manage-trips-link').click();

    // Duplicate the trip
    await page.getByTestId('trip-menu-trip-').first().click();
    await page.getByTestId('duplicate-trip-trip-').first().click();

    // Should show both original and copy
    await expect(page.getByText('Original Trip')).toBeVisible();
    await expect(page.getByText('Original Trip (Copy)')).toBeVisible();
  });
});
