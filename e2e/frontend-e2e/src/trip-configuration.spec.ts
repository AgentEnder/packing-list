import { test, expect } from '@playwright/test';
import { setupTestSession } from './utils.js';

test.describe('Trip Configuration', () => {
  test.beforeEach(async ({ page, context }) => {
    await setupTestSession(page, context, false);
    await page.goto('/days');
  });

  test('can configure a basic trip with single destination', async ({
    page,
  }) => {
    // Navigate to trip configuration
    await page.getByRole('button', { name: 'Configure Trip' }).click();

    // Step 1: Set trip dates
    await page.locator('input[name="leaveHomeDate"]').fill('2024-12-01');
    await page.locator('input[name="arriveHomeDate"]').fill('2024-12-08');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2: Add destination
    await page.locator('input[name="location"]').fill('Paris');
    await page.locator('input[name="arriveDate"]').fill('2024-12-02');
    await page.locator('input[name="leaveDate"]').fill('2024-12-07');
    await page.getByRole('button', { name: 'Add Destination' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: Save trip
    await page.getByRole('button', { name: 'Save Trip' }).click();

    // Verify day-by-day view shows the trip
    // Day 1: Departure
    await expect(page.getByTestId('day-row-0')).toBeVisible();
    await expect(page.getByTestId('event-button-leave_home-0')).toBeVisible();

    // Day 2: Arrive in Paris
    await expect(page.getByTestId('day-row-1')).toBeVisible();
    await expect(
      page.getByTestId('event-button-arrive_destination-1')
    ).toBeVisible();

    // Days 3-6: Paris
    await expect(page.getByTestId('day-row-2')).toBeVisible();
    await expect(page.getByTestId('day-location-2')).toHaveText('Paris');

    // Day 7: Depart Paris
    await expect(page.getByTestId('day-row-6')).toBeVisible();
    await expect(
      page.getByTestId('event-button-leave_destination-6')
    ).toBeVisible();

    // Day 8: Return Home
    await expect(page.getByTestId('day-row-7')).toBeVisible();
    await expect(page.getByTestId('event-button-arrive_home-7')).toBeVisible();
  });

  test('validates trip dates correctly', async ({ page }) => {
    await page.getByRole('button', { name: 'Configure Trip' }).click();

    // Try setting return date before departure date
    await page.locator('input[name="leaveHomeDate"]').fill('2024-12-08');
    await page.locator('input[name="arriveHomeDate"]').fill('2024-12-01');

    // Verify Next button is disabled
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();

    // Fix dates and verify button becomes enabled
    await page.locator('input[name="leaveHomeDate"]').fill('2024-12-01');
    await page.locator('input[name="arriveHomeDate"]').fill('2024-12-08');
    await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  test('can add multiple destinations', async ({ page }) => {
    await page.getByRole('button', { name: 'Configure Trip' }).click();

    // Set trip dates
    await page.locator('input[name="leaveHomeDate"]').fill('2024-12-01');
    await page.locator('input[name="arriveHomeDate"]').fill('2024-12-15');
    await page.getByRole('button', { name: 'Next' }).click();

    // Add first destination
    await page.locator('input[name="location"]').fill('London');
    await page.locator('input[name="arriveDate"]').fill('2024-12-02');
    await page.locator('input[name="leaveDate"]').fill('2024-12-07');
    await page.getByRole('button', { name: 'Add Destination' }).click();

    // Add second destination
    await page.locator('input[name="location"]').fill('Paris');
    await page.locator('input[name="arriveDate"]').fill('2024-12-08');
    await page.locator('input[name="leaveDate"]').fill('2024-12-14');
    await page.getByRole('button', { name: 'Add Destination' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Save trip
    await page.getByRole('button', { name: 'Save Trip' }).click();

    // Verify both destinations are shown in the day-by-day view
    // Day 1: Departure
    await expect(page.getByTestId('day-row-0')).toBeVisible();
    await expect(page.getByTestId('event-button-leave_home-0')).toBeVisible();

    // Day 2: Arrive in London
    await expect(page.getByTestId('day-row-1')).toBeVisible();
    await expect(
      page.getByTestId('event-button-arrive_destination-1')
    ).toBeVisible();

    // Day 7: Depart London
    await expect(page.getByTestId('day-row-6')).toBeVisible();
    await expect(
      page.getByTestId('event-button-leave_destination-6')
    ).toBeVisible();

    // Day 8: Arrive in Paris
    await expect(page.getByTestId('day-row-7')).toBeVisible();
    await expect(
      page.getByTestId('event-button-arrive_destination-7')
    ).toBeVisible();

    // Day 14: Depart Paris
    await expect(page.getByTestId('day-row-13')).toBeVisible();
    await expect(
      page.getByTestId('event-button-leave_destination-13')
    ).toBeVisible();

    // Day 15: Return Home
    await expect(page.getByTestId('day-row-14')).toBeVisible();
    await expect(page.getByTestId('event-button-arrive_home-14')).toBeVisible();
  });

  test('can edit an existing destination', async ({ page }) => {
    await page.getByRole('button', { name: 'Configure Trip' }).click();

    // Set up initial trip
    await page.locator('input[name="leaveHomeDate"]').fill('2024-12-01');
    await page.locator('input[name="arriveHomeDate"]').fill('2024-12-08');
    await page.getByRole('button', { name: 'Next' }).click();

    // Add initial destination
    await page.locator('input[name="location"]').fill('Paris');
    await page.locator('input[name="arriveDate"]').fill('2024-12-02');
    await page.locator('input[name="leaveDate"]').fill('2024-12-07');
    await page.getByRole('button', { name: 'Add Destination' }).click();

    // Wait for the destination to be added and verify it's in the list
    const destinationsList = page.getByTestId('destinations-list');
    await expect(destinationsList).toBeVisible();
    await expect(destinationsList.getByText('Paris')).toBeVisible();

    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Save Trip' }).click();

    // Wait for navigation and verify we're back on the days page
    await expect(page.getByTestId('day-row-0')).toBeVisible();

    // Edit the trip
    await page.getByRole('button', { name: 'Configure Trip' }).click();

    // Wait for the modal to be fully open. It should be on the "review" step.
    await expect(page.locator('.modal.modal-open')).toBeVisible();
    await expect(page.getByText('Review Your Trip')).toBeVisible();

    // Go back to the destinations step
    await page.getByRole('button', { name: 'Back' }).click();

    // Wait for the destinations list to be rendered and verify Paris is there
    const editDestinationsList = page.getByTestId('destinations-list');
    await expect(editDestinationsList).toBeVisible();
    await expect(editDestinationsList.getByText('Paris')).toBeVisible();

    // Click the Edit button for the destination and wait for edit form
    const editButton = page.getByTestId('edit-destination-Paris');
    await expect(editButton).toBeVisible();
    await editButton.click();
    await expect(page.locator('input[name="location"]')).toBeVisible();
    await expect(page.locator('input[name="location"]')).toHaveValue('Paris');

    // Modify destination
    await page.locator('input[name="location"]').fill('Modified Paris');
    await page.getByRole('button', { name: 'Update Destination' }).click();

    // Verify the updated destination is shown in the list
    await expect(
      editDestinationsList.getByText('Modified Paris')
    ).toBeVisible();

    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Update Trip' }).click();

    // Wait for navigation and verify changes in the day-by-day view
    await expect(page.getByTestId('day-row-1')).toBeVisible();

    // Verify the modified destination appears in the arrival event
    const arrivalEvent = page.getByTestId('event-button-arrive_destination-1');
    await expect(arrivalEvent).toBeVisible();
    await expect(arrivalEvent).toContainText('Modified Paris');

    // Also verify the destination is shown in the regular day view
    await expect(page.getByTestId('day-location-2')).toHaveText(
      'Modified Paris'
    );
  });

  test('can edit a trip event by clicking it in the day view', async ({
    page,
  }) => {
    // Set up initial trip
    await page.getByRole('button', { name: 'Configure Trip' }).click();
    await page.locator('input[name="leaveHomeDate"]').fill('2024-12-01');
    await page.locator('input[name="arriveHomeDate"]').fill('2024-12-08');
    await page.getByRole('button', { name: 'Next' }).click();

    // Add destination
    await page.locator('input[name="location"]').fill('Paris');
    await page.locator('input[name="arriveDate"]').fill('2024-12-02');
    await page.locator('input[name="leaveDate"]').fill('2024-12-07');
    await page.getByRole('button', { name: 'Add Destination' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Save Trip' }).click();

    // Wait for the day view to be rendered
    await expect(page.getByTestId('day-row-0')).toBeVisible();

    // Click on the arrival event
    const arrivalEvent = page.getByTestId('event-button-arrive_destination-1');
    await expect(arrivalEvent).toBeVisible();
    await arrivalEvent.click();

    // Wait for the edit modal to open
    await expect(page.locator('.modal.modal-open')).toBeVisible();

    // Verify the form is pre-filled with the event details
    await expect(page.locator('select[name="type"]')).toHaveValue(
      'arrive_destination'
    );
    await expect(page.locator('input[name="date"]')).toHaveValue('2024-12-02');
    await expect(page.locator('input[name="location"]')).toHaveValue('Paris');

    // Add notes to the event
    await page
      .locator('textarea[name="notes"]')
      .fill('Arriving at Charles de Gaulle Airport');
    await page.getByRole('button', { name: 'Update Event' }).click();

    // Verify the changes in the day view
    await expect(page.getByTestId('day-row-1')).toBeVisible();
    const updatedArrivalEvent = page.getByTestId(
      'event-button-arrive_destination-1'
    );
    await expect(updatedArrivalEvent).toContainText('Arriving Paris');
    await expect(updatedArrivalEvent).toContainText(
      'Arriving at Charles de Gaulle Airport'
    );
  });
});
