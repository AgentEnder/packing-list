import { describe, it, expect } from 'vitest';
import { selectAccurateTripSummaries } from './selectors.js';
import {
  createTestTripState,
  createTestPerson,
} from './__tests__/test-helpers.js';
import { PackingListItem, Person } from '@packing-list/model';

describe('selectAccurateTripSummaries', () => {
  it('should calculate accurate people count', () => {
    const people: Person[] = [
      createTestPerson({
        id: 'person1',
        name: 'Alice',
        age: 25,
        gender: 'female',
      }),
      createTestPerson({ id: 'person2', name: 'Bob', age: 30, gender: 'male' }),
    ];

    const state = createTestTripState({ people });
    const summaries = selectAccurateTripSummaries(state);

    expect(summaries).toHaveLength(1);
    expect(summaries[0].totalPeople).toBe(2);
  });

  it('should calculate accurate item counts', () => {
    const items: PackingListItem[] = [
      {
        id: '1',
        ruleId: 'rule1',
        name: 'Shirt',
        itemName: 'Shirt',
        quantity: 2,
        isPacked: false,
        isOverridden: false,
        isExtra: false,
        ruleHash: 'hash1',
      },
      {
        id: '2',
        ruleId: 'rule2',
        name: 'Pants',
        itemName: 'Pants',
        quantity: 1,
        isPacked: true,
        isOverridden: false,
        isExtra: false,
        ruleHash: 'hash2',
      },
      {
        id: '3',
        ruleId: 'rule3',
        name: 'Socks',
        itemName: 'Socks',
        quantity: 3,
        isPacked: true,
        isOverridden: false,
        isExtra: false,
        ruleHash: 'hash3',
      },
    ];

    const state = createTestTripState({});
    const tripId = state.trips.selectedTripId!;

    // Update the trip data with test items
    state.trips.byId[tripId].calculated.packingListItems = items;

    const summaries = selectAccurateTripSummaries(state);

    expect(summaries).toHaveLength(1);
    expect(summaries[0].totalItems).toBe(6); // 2 + 1 + 3
    expect(summaries[0].packedItems).toBe(4); // 0 + 1 + 3
  });

  it('should handle empty trip data gracefully', () => {
    const state = createTestTripState({});
    const summaries = selectAccurateTripSummaries(state);

    expect(summaries).toHaveLength(1);
    expect(summaries[0].totalPeople).toBe(0);
    expect(summaries[0].totalItems).toBe(0);
    expect(summaries[0].packedItems).toBe(0);
  });

  it('should preserve original summary data while updating counts', () => {
    const state = createTestTripState({
      tripId: 'test-trip-123',
      title: 'My Vacation',
      description: 'Summer trip',
    });

    const summaries = selectAccurateTripSummaries(state);

    expect(summaries).toHaveLength(1);
    expect(summaries[0].tripId).toBe('test-trip-123');
    expect(summaries[0].title).toBe('My Vacation');
    expect(summaries[0].description).toBe('Summer trip');
    expect(summaries[0].createdAt).toBeDefined();
    expect(summaries[0].updatedAt).toBeDefined();
  });

  it('should handle missing trip data', () => {
    const state = createTestTripState({});

    // Add a summary for a trip that doesn't exist in byId
    state.trips.summaries.push({
      tripId: 'missing-trip',
      title: 'Missing Trip',
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalItems: 999,
      packedItems: 999,
      totalPeople: 999,
    });

    const summaries = selectAccurateTripSummaries(state);

    expect(summaries).toHaveLength(2);

    // First trip should have calculated values
    expect(summaries[0].totalPeople).toBe(0);
    expect(summaries[0].totalItems).toBe(0);
    expect(summaries[0].packedItems).toBe(0);

    // Missing trip should keep original values
    const missingTripSummary = summaries.find(
      (s) => s.tripId === 'missing-trip'
    );
    expect(missingTripSummary!.totalPeople).toBe(999);
    expect(missingTripSummary!.totalItems).toBe(999);
    expect(missingTripSummary!.packedItems).toBe(999);
  });
});
