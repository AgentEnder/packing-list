import { test } from '@playwright/test';
import { setupTestSession } from './utils';
import { TripManager } from './page-objects/trip-manager';

test.describe('Trip Management', () => {
  let tripManager: TripManager;

  test.beforeEach(async ({ page, context }) => {
    await setupTestSession(page, context, 'fresh');
    tripManager = new TripManager(page);
  });

  test('should show no trip selected state when no trips exist', async () => {
    await tripManager.expectNoTripSelected();
  });

  test('should create a new trip with wizard', async () => {
    await tripManager.createFirstTrip({
      template: 'business',
      title: 'Business Trip NYC',
      startDate: '2024-06-15',
      endDate: '2024-06-20',
      skipDates: true, // Use skip dates for simpler test
    });

    await tripManager.expectTripSelected('Business Trip NYC');
  });

  test('should create a new trip without dates', async () => {
    await tripManager.createFirstTrip({
      template: 'business',
      title: 'Business Trip Without Dates',
      skipDates: true,
    });

    await tripManager.expectTripSelected('Business Trip Without Dates');
  });

  test('should manage multiple trips', async () => {
    // Create first trip
    await tripManager.createFirstTrip({
      template: 'business',
      title: 'Business Trip',
      skipDates: true,
    });

    // Create second trip
    await tripManager.createAdditionalTrip({
      template: 'vacation',
      title: 'Vacation Trip',
      skipDates: true,
    });

    // Should see the new trip selected
    await tripManager.expectTripSelected('Vacation Trip');
  });

  test('should switch between trips', async () => {
    // Create first trip
    await tripManager.createFirstTrip({
      template: 'business',
      title: 'Trip A',
      skipDates: true,
    });

    // Create second trip
    await tripManager.createAdditionalTrip({
      template: 'vacation',
      title: 'Trip B',
      skipDates: true,
    });

    // Switch back to first trip
    await tripManager.switchToTrip('Trip A');
    await tripManager.expectTripSelected('Trip A');
  });

  test('should delete a trip', async () => {
    // Create a trip first
    await tripManager.createFirstTrip({
      template: 'business',
      title: 'Trip to Delete',
      skipDates: true,
    });

    // Delete the trip
    await tripManager.deleteTrip('Trip to Delete');

    // After deleting the last trip, should see empty state
    await tripManager.expectEmptyTripsState();
  });

  test('should duplicate a trip', async () => {
    // Create a trip first
    await tripManager.createFirstTrip({
      template: 'business',
      title: 'Original Trip',
      skipDates: true,
    });

    // Duplicate the trip
    await tripManager.duplicateTrip('Original Trip');

    // Should see two trips with the same name
    await tripManager.expectTripCount('Original Trip', 2);
  });
});
