/* eslint-disable @typescript-eslint/no-explicit-any  -- We are using any to access private methods */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncService, resetSyncService } from '../sync.js';
import {
  createTripChange,
  createPersonChange,
  createItemChange,
} from './test-utils.js';

// Mock the supabase module
vi.mock('@packing-list/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
  isSupabaseAvailable: () => true,
}));

// Mock other dependencies
vi.mock('@packing-list/offline-storage', () => ({
  getDatabase: vi.fn(),
  TripStorage: { saveTrip: vi.fn() },
  PersonStorage: { savePerson: vi.fn() },
  ItemStorage: { saveItem: vi.fn() },
  RuleOverrideStorage: { saveRuleOverride: vi.fn() },
  DefaultItemRulesStorage: { saveDefaultItemRule: vi.fn() },
  RulePacksStorage: { saveRulePack: vi.fn() },
  TripRulesStorage: { saveTripRule: vi.fn() },
  ConflictsStorage: { saveConflict: vi.fn() },
}));

vi.mock('@packing-list/connectivity', () => ({
  getConnectivityService: () => ({
    isOnline: () => true,
    subscribe: () => {
      // Return unsubscribe function
      return () => {
        // Cleanup logic would go here
      };
    },
  }),
}));

// Import the mocked supabase for testing
import { supabase } from '@packing-list/supabase';

describe('ID Preservation in Sync Operations', () => {
  let syncService: SyncService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create real SyncService with mocked dependencies
    syncService = new SyncService({
      demoMode: false,
      autoSyncInterval: 1000000, // Very long interval to prevent auto-sync
    });
  });

  afterEach(() => {
    syncService.stop();
    resetSyncService();
  });

  describe('Trip ID Preservation', () => {
    it('should include client-generated trip ID in INSERT statement', async () => {
      const clientGeneratedId = 'trip-client-12345';
      const tripChange = createTripChange({
        operation: 'create',
        entityId: clientGeneratedId,
        userId: 'user-456',
        version: 1,
        title: 'Test Trip',
        description: 'A test trip with client-generated ID',
      });

      // Use the private method via type assertion for testing
      const syncServiceAny = syncService as any;
      await syncServiceAny.pushTripChange(tripChange);

      expect(supabase.from).toHaveBeenCalledWith('trips');
      const mockTable = supabase.from('trips');
      expect(mockTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: clientGeneratedId, // Client-generated ID should be preserved
          user_id: 'user-456',
          title: 'Test Trip',
          description: 'A test trip with client-generated ID',
          version: 1,
        })
      );
    });
  });

  describe('Person ID Preservation', () => {
    it('should include client-generated person ID in INSERT statement', async () => {
      const clientGeneratedId = 'person-client-67890';
      const personChange = createPersonChange({
        operation: 'create',
        entityId: clientGeneratedId,
        userId: 'user-456',
        tripId: 'trip-789',
        version: 1,
        name: 'John Doe',
        age: 30,
        gender: 'male',
      });

      const syncServiceAny = syncService as any;
      await syncServiceAny.pushPersonChange(personChange);

      expect(supabase.from).toHaveBeenCalledWith('trip_people');
      const mockTable = supabase.from('trip_people');
      expect(mockTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: clientGeneratedId, // Client-generated ID should be preserved
          trip_id: 'trip-789',
          name: 'John Doe',
          age: 30,
          gender: 'male',
          version: 1,
        })
      );
    });
  });

  describe('Item ID Preservation', () => {
    it('should include client-generated item ID in INSERT statement', async () => {
      const clientGeneratedId = 'item-client-abcdef';
      const itemChange = createItemChange({
        operation: 'create',
        entityId: clientGeneratedId,
        userId: 'user-456',
        tripId: 'trip-789',
        version: 1,
        name: 'Test Item',
        category: 'clothing',
        quantity: 2,
        personId: 'person-123',
        dayIndex: 0,
      });

      const syncServiceAny = syncService as any;
      await syncServiceAny.pushItemChange(itemChange);

      expect(supabase.from).toHaveBeenCalledWith('trip_items');
      const mockTable = supabase.from('trip_items');
      expect(mockTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: clientGeneratedId, // Client-generated ID should be preserved
          trip_id: 'trip-789',
          name: 'Test Item',
          category: 'clothing',
          quantity: 2,
          person_id: 'person-123',
          day_index: 0,
          version: 1,
        })
      );
    });
  });

  describe('Trip Rule ID Preservation', () => {
    it('should include client-generated trip rule ID in INSERT statement', async () => {
      // Create a manual trip rule change since createTripRuleChange doesn't exist
      const clientGeneratedId = 'trip-rule-client-xyz123';
      const tripRuleChange = {
        entityType: 'trip_rule' as const,
        operation: 'create' as const,
        entityId: clientGeneratedId,
        userId: 'user-456',
        tripId: 'trip-789',
        version: 1,
        data: {
          ruleId: 'default-rule-123',
        },
      };

      const syncServiceAny = syncService as any;
      await syncServiceAny.pushTripRuleChange(tripRuleChange);

      expect(supabase.from).toHaveBeenCalledWith('trip_default_item_rules');
      const mockTable = supabase.from('trip_default_item_rules');
      expect(mockTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: clientGeneratedId, // Client-generated ID should be preserved
          trip_id: 'trip-789',
          rule_id: 'default-rule-123',
          version: 1,
        })
      );
    });
  });

  describe('UUID Format Validation', () => {
    it('should work with standard UUID format', async () => {
      const uuidId = '550e8400-e29b-41d4-a716-446655440000';
      const tripChange = createTripChange({
        operation: 'create',
        entityId: uuidId,
        userId: 'user-456',
        version: 1,
        title: 'UUID Trip',
      });

      const syncServiceAny = syncService as any;
      await syncServiceAny.pushTripChange(tripChange);

      const mockTable = supabase.from('trips');
      expect(mockTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: uuidId,
        })
      );
    });

    it('should work with custom client-generated IDs', async () => {
      const customId = 'custom-trip-2024-01-15-abc123';
      const tripChange = createTripChange({
        operation: 'create',
        entityId: customId,
        userId: 'user-456',
        version: 1,
        title: 'Custom ID Trip',
      });

      const syncServiceAny = syncService as any;
      await syncServiceAny.pushTripChange(tripChange);

      const mockTable = supabase.from('trips');
      expect(mockTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: customId,
        })
      );
    });
  });

  describe('Error Handling with ID Preservation', () => {
    it('should handle ID conflicts gracefully', async () => {
      // Mock a unique constraint violation error
      const mockTable = supabase.from('trips');
      vi.mocked(mockTable.insert).mockResolvedValueOnce({
        error: new Error('duplicate key value violates unique constraint'),
        data: null,
        count: null,
        status: 409,
        statusText: 'Conflict',
      } as any);

      const clientGeneratedId = 'duplicate-trip-id';
      const tripChange = createTripChange({
        operation: 'create',
        entityId: clientGeneratedId,
        userId: 'user-456',
        version: 1,
        title: 'Duplicate ID Trip',
      });

      const syncServiceAny = syncService as any;

      await expect(syncServiceAny.pushTripChange(tripChange)).rejects.toThrow();

      // Verify the ID was still included in the attempt
      expect(mockTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: clientGeneratedId,
        })
      );
    });
  });
});
