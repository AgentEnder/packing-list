import { describe, it, expect } from 'vitest';
import {
  deepDiff,
  deepEqual,
  smartMerge,
  getDefaultIgnorePaths,
} from '../deep-diff-utils.js';

describe('deepDiff', () => {
  it('should detect no conflicts when objects are identical', () => {
    const localData = {
      id: 'trip-1',
      title: 'My Trip',
      days: [
        { date: '2024-01-01', location: 'Paris', activities: ['sightseeing'] },
        { date: '2024-01-02', location: 'London', activities: ['museums'] },
      ],
    };

    const serverData = { ...localData };

    const result = deepDiff(localData, serverData);

    expect(result.hasConflicts).toBe(false);
    expect(result.conflicts).toHaveLength(0);
  });

  it('should detect conflicts only in changed nested fields', () => {
    const localData = {
      id: 'trip-1',
      title: 'My Trip',
      days: [
        { date: '2024-01-01', location: 'Paris', activities: ['sightseeing'] },
        { date: '2024-01-02', location: 'London', activities: ['museums'] },
      ],
      settings: { timezone: 'UTC' },
    };

    const serverData = {
      id: 'trip-1',
      title: 'My Trip',
      days: [
        { date: '2024-01-01', location: 'Paris', activities: ['sightseeing'] },
        { date: '2024-01-02', location: 'Rome', activities: ['food'] }, // Changed location and activities
      ],
      settings: { timezone: 'UTC' },
    };

    const result = deepDiff(localData, serverData);

    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts.length).toBeGreaterThan(0);
    // Should detect conflicts in the nested array structure
    const daysConflicts = result.conflicts.filter((c) =>
      c.path.startsWith('days.')
    );
    expect(daysConflicts.length).toBeGreaterThan(0);
    expect(result.conflicts.some((c) => c.type === 'modified')).toBe(true);
  });

  it('should ignore system-managed fields', () => {
    const localData = {
      id: 'trip-1',
      title: 'My Trip',
      updatedAt: '2024-01-01T10:00:00Z',
      timestamp: 1640995200000,
    };

    const serverData = {
      id: 'trip-1',
      title: 'My Trip',
      updatedAt: '2024-01-01T11:00:00Z', // Different timestamp
      timestamp: 1640998800000, // Different timestamp
    };

    const ignorePaths = getDefaultIgnorePaths();
    const result = deepDiff(localData, serverData, ignorePaths);

    expect(result.hasConflicts).toBe(false);
    expect(result.conflicts).toHaveLength(0);
  });

  it('should detect field-level changes within arrays', () => {
    const localData = {
      id: 'trip-1',
      days: [
        {
          date: '2024-01-01',
          location: 'Paris',
          items: ['passport', 'camera'],
        },
        { date: '2024-01-02', location: 'London', items: ['umbrella'] },
      ],
    };

    const serverData = {
      id: 'trip-1',
      days: [
        {
          date: '2024-01-01',
          location: 'Paris',
          items: ['passport', 'camera'],
        },
        { date: '2024-01-02', location: 'London', items: ['umbrella', 'map'] }, // Added item
      ],
    };

    const result = deepDiff(localData, serverData);

    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts).toHaveLength(1);
    // Should detect specific field-level changes within the array
    expect(result.conflicts[0].path).toBe('days.1.items');
  });

  it('should handle adding and removing fields', () => {
    const localData = {
      id: 'trip-1',
      title: 'My Trip',
      description: 'A great trip', // Only in local
    };

    const serverData = {
      id: 'trip-1',
      title: 'My Trip',
      notes: 'Server notes', // Only in server
    };

    const result = deepDiff(localData, serverData);

    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts).toHaveLength(2);

    const addedConflict = result.conflicts.find((c) => c.type === 'added');
    const removedConflict = result.conflicts.find((c) => c.type === 'removed');

    expect(addedConflict?.path).toBe('notes');
    expect(removedConflict?.path).toBe('description');
  });
});

describe('smartMerge', () => {
  it('should merge objects with prefer-server strategy', () => {
    const localData = {
      id: 'trip-1',
      title: 'Local Title',
      description: 'Local description',
    };

    const serverData = {
      id: 'trip-1',
      title: 'Server Title',
      notes: 'Server notes',
    };

    const result = smartMerge(localData, serverData, 'prefer-server');

    expect(result.title).toBe('Server Title');
    expect(result.description).toBe('Local description'); // Kept from local
    expect(result.notes).toBe('Server notes'); // Added from server
  });

  it('should merge objects with prefer-local strategy', () => {
    const localData = {
      id: 'trip-1',
      title: 'Local Title',
      description: 'Local description',
    };

    const serverData = {
      id: 'trip-1',
      title: 'Server Title',
      notes: 'Server notes',
    };

    const result = smartMerge(localData, serverData, 'prefer-local');

    expect(result.title).toBe('Local Title');
    expect(result.description).toBe('Local description');
    expect(result.notes).toBe('Server notes'); // Still added from server
  });
});

describe('deepEqual', () => {
  it('should return true for identical objects', () => {
    const obj1 = {
      id: 'trip-1',
      days: [
        { date: '2024-01-01', location: 'Paris' },
        { date: '2024-01-02', location: 'London' },
      ],
    };

    const obj2 = {
      id: 'trip-1',
      days: [
        { date: '2024-01-01', location: 'Paris' },
        { date: '2024-01-02', location: 'London' },
      ],
    };

    expect(deepEqual(obj1, obj2)).toBe(true);
  });

  it('should return false for different objects', () => {
    const obj1 = {
      id: 'trip-1',
      days: [
        { date: '2024-01-01', location: 'Paris' },
        { date: '2024-01-02', location: 'London' },
      ],
    };

    const obj2 = {
      id: 'trip-1',
      days: [
        { date: '2024-01-01', location: 'Paris' },
        { date: '2024-01-02', location: 'Rome' }, // Different location
      ],
    };

    expect(deepEqual(obj1, obj2)).toBe(false);
  });
});

describe('Trip scenario examples', () => {
  it('should only conflict on changed days, not entire trip', () => {
    const localTrip = {
      id: 'trip-1',
      title: 'European Adventure',
      days: [
        {
          date: '2024-01-01',
          location: 'Paris',
          expectedClimate: 'cold',
          items: [
            { name: 'warm jacket', packed: false },
            { name: 'camera', packed: true },
          ],
        },
        {
          date: '2024-01-02',
          location: 'London',
          expectedClimate: 'rainy',
          items: [
            { name: 'umbrella', packed: false }, // Local: not packed
            { name: 'book', packed: true },
          ],
        },
      ],
      settings: { timezone: 'Europe/Paris' },
    };

    const serverTrip = {
      id: 'trip-1',
      title: 'European Adventure',
      days: [
        {
          date: '2024-01-01',
          location: 'Paris',
          expectedClimate: 'cold',
          items: [
            { name: 'warm jacket', packed: false },
            { name: 'camera', packed: true },
          ],
        },
        {
          date: '2024-01-02',
          location: 'London',
          expectedClimate: 'rainy',
          items: [
            { name: 'umbrella', packed: true }, // Server: packed
            { name: 'book', packed: true },
          ],
        },
      ],
      settings: { timezone: 'Europe/Paris' },
    };

    const result = deepDiff(localTrip, serverTrip);

    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts).toHaveLength(1);
    // Should detect the specific packed field that changed within the nested structure
    expect(result.conflicts[0].path).toBe('days.1.items.0.packed');
    expect(result.conflicts[0].type).toBe('modified');
    expect(result.conflicts[0].localValue).toBe(false);
    expect(result.conflicts[0].serverValue).toBe(true);

    // The conflict should be in the days array, specifically the second day's items
    // The first day should be identical and not conflicted
    const mergedTrip = result.mergedObject;
    expect(mergedTrip.title).toBe('European Adventure');
    expect(mergedTrip.settings).toEqual({ timezone: 'Europe/Paris' });
  });

  it('should not create conflicts when only system fields differ', () => {
    const localTrip = {
      id: 'trip-1',
      title: 'European Adventure',
      days: [{ date: '2024-01-01', location: 'Paris' }],
      updatedAt: '2024-01-01T10:00:00Z',
      version: 1,
    };

    const serverTrip = {
      id: 'trip-1',
      title: 'European Adventure',
      days: [{ date: '2024-01-01', location: 'Paris' }],
      updatedAt: '2024-01-01T11:00:00Z', // Different update time
      version: 2, // Different version
    };

    const ignorePaths = getDefaultIgnorePaths();
    const result = deepDiff(localTrip, serverTrip, ignorePaths);

    expect(result.hasConflicts).toBe(false);
    expect(result.conflicts).toHaveLength(0);
  });
});
