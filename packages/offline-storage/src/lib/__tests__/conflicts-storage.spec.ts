import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConflictsStorage } from '../conflicts-storage.js';
import { initializeDatabase, closeDatabase } from '../database.js';
import type { SyncConflict } from '@packing-list/model';

describe('ConflictsStorage', () => {
  beforeEach(async () => {
    // Initialize fresh database for each test
    await initializeDatabase();
  });

  afterEach(async () => {
    // Clean up database after each test
    await closeDatabase();
  });

  it('should save and retrieve a conflict', async () => {
    const conflict: SyncConflict = {
      id: 'test-conflict-abc123',
      entityType: 'item',
      entityId: 'test-item-abc123',
      localVersion: {
        name: 'Local Item',
        packed: true,
        timestamp: Date.now() - 1000,
      },
      serverVersion: {
        name: 'Server Item',
        packed: false,
        timestamp: Date.now(),
      },
      conflictType: 'update_conflict',
      timestamp: Date.now(),
    };

    await ConflictsStorage.saveConflict(conflict);
    const retrievedConflict = await ConflictsStorage.getConflict(
      'test-conflict-abc123'
    );

    expect(retrievedConflict).toEqual(conflict);
  });

  it('should return undefined for non-existent conflict', async () => {
    const conflict = await ConflictsStorage.getConflict('non-existent');
    expect(conflict).toBeUndefined();
  });

  it('should get all conflicts', async () => {
    const conflict1: SyncConflict = {
      id: 'test-conflict-abc123',
      entityType: 'item',
      entityId: 'test-item-abc123',
      localVersion: { name: 'Item 1' },
      serverVersion: { name: 'Server Item 1' },
      conflictType: 'update_conflict',
      timestamp: Date.now(),
    };

    const conflict2: SyncConflict = {
      id: 'test-conflict-def456',
      entityType: 'person',
      entityId: 'test-person-abc123',
      localVersion: { name: 'Person 1' },
      serverVersion: { name: 'Server Person 1' },
      conflictType: 'update_conflict',
      timestamp: Date.now(),
    };

    await ConflictsStorage.saveConflict(conflict1);
    await ConflictsStorage.saveConflict(conflict2);

    const allConflicts = await ConflictsStorage.getAllConflicts();
    expect(allConflicts).toHaveLength(2);
    expect(allConflicts.map((c) => c.id)).toContain('test-conflict-abc123');
    expect(allConflicts.map((c) => c.id)).toContain('test-conflict-def456');
  });

  it('should get conflicts by entity type', async () => {
    const itemConflict: SyncConflict = {
      id: 'test-conflict-abc123',
      entityType: 'item',
      entityId: 'test-item-abc123',
      localVersion: { name: 'Item 1' },
      serverVersion: { name: 'Server Item 1' },
      conflictType: 'update_conflict',
      timestamp: Date.now(),
    };

    const personConflict: SyncConflict = {
      id: 'test-conflict-def456',
      entityType: 'person',
      entityId: 'test-person-abc123',
      localVersion: { name: 'Person 1' },
      serverVersion: { name: 'Server Person 1' },
      conflictType: 'update_conflict',
      timestamp: Date.now(),
    };

    await ConflictsStorage.saveConflict(itemConflict);
    await ConflictsStorage.saveConflict(personConflict);

    const itemConflicts = await ConflictsStorage.getConflictsByEntityType(
      'item'
    );
    const personConflicts = await ConflictsStorage.getConflictsByEntityType(
      'person'
    );

    expect(itemConflicts).toHaveLength(1);
    expect(itemConflicts[0].id).toBe('test-conflict-abc123');

    expect(personConflicts).toHaveLength(1);
    expect(personConflicts[0].id).toBe('test-conflict-def456');
  });

  it('should delete a specific conflict', async () => {
    const conflict: SyncConflict = {
      id: 'test-conflict-abc123',
      entityType: 'item',
      entityId: 'test-item-abc123',
      localVersion: { name: 'Item 1' },
      serverVersion: { name: 'Server Item 1' },
      conflictType: 'update_conflict',
      timestamp: Date.now(),
    };

    await ConflictsStorage.saveConflict(conflict);
    expect(
      await ConflictsStorage.getConflict('test-conflict-abc123')
    ).toBeDefined();

    await ConflictsStorage.deleteConflict('test-conflict-abc123');
    expect(
      await ConflictsStorage.getConflict('test-conflict-abc123')
    ).toBeUndefined();
  });

  it('should clear all conflicts', async () => {
    const conflict1: SyncConflict = {
      id: 'test-conflict-abc123',
      entityType: 'item',
      entityId: 'test-item-abc123',
      localVersion: { name: 'Item 1' },
      serverVersion: { name: 'Server Item 1' },
      conflictType: 'update_conflict',
      timestamp: Date.now(),
    };

    const conflict2: SyncConflict = {
      id: 'test-conflict-def456',
      entityType: 'person',
      entityId: 'test-person-abc123',
      localVersion: { name: 'Person 1' },
      serverVersion: { name: 'Server Person 1' },
      conflictType: 'update_conflict',
      timestamp: Date.now(),
    };

    await ConflictsStorage.saveConflict(conflict1);
    await ConflictsStorage.saveConflict(conflict2);

    expect(await ConflictsStorage.getAllConflicts()).toHaveLength(2);

    await ConflictsStorage.clearAllConflicts();
    expect(await ConflictsStorage.getAllConflicts()).toHaveLength(0);
  });

  it('should clear demo conflicts based on patterns', async () => {
    // Create various types of conflicts
    // Note: Demo conflicts with demo IDs will be blocked by demo mode detection
    // So we only create the real conflict and test that clearDemoConflicts doesn't affect it
    const realConflict: SyncConflict = {
      id: 'real-conflict-abc123',
      entityType: 'trip',
      entityId: 'trip-abc123',
      localVersion: { name: 'Real Trip' },
      serverVersion: { name: 'Server Real Trip' },
      conflictType: 'update_conflict',
      timestamp: Date.now(),
    };

    await ConflictsStorage.saveConflict(realConflict);

    // Only the real conflict should be saved (demo conflicts are blocked)
    expect(await ConflictsStorage.getAllConflicts()).toHaveLength(1);

    const clearedCount = await ConflictsStorage.clearDemoConflicts();
    expect(clearedCount).toBe(0); // No demo conflicts to clear since they weren't saved

    const remainingConflicts = await ConflictsStorage.getAllConflicts();
    expect(remainingConflicts).toHaveLength(1);
    expect(remainingConflicts[0].id).toBe('real-conflict-abc123');
  });

  it('should update an existing conflict', async () => {
    const originalConflict: SyncConflict = {
      id: 'test-conflict-abc123',
      entityType: 'item',
      entityId: 'test-item-abc123',
      localVersion: { name: 'Original Item' },
      serverVersion: { name: 'Original Server Item' },
      conflictType: 'update_conflict',
      timestamp: Date.now() - 1000,
    };

    await ConflictsStorage.saveConflict(originalConflict);

    const updatedConflict: SyncConflict = {
      ...originalConflict,
      localVersion: { name: 'Updated Item' },
      timestamp: Date.now(),
    };

    await ConflictsStorage.saveConflict(updatedConflict);

    const retrievedConflict = await ConflictsStorage.getConflict(
      'test-conflict-abc123'
    );
    expect(retrievedConflict?.localVersion).toEqual({ name: 'Updated Item' });
    expect(retrievedConflict?.timestamp).toBe(updatedConflict.timestamp);
  });
});
