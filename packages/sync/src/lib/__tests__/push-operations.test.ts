/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
};

// Create a mock table response builder
const createMockTable = () => ({
  insert: vi.fn().mockReturnValue({ error: null }),
  update: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ error: null }),
    }),
  }),
  upsert: vi.fn().mockReturnValue({ error: null }),
});

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase.from.mockReturnValue(createMockTable());
});

// Mock the supabase import
vi.mock('@packing-list/supabase', () => ({
  supabase: mockSupabase,
  isSupabaseAvailable: vi.fn().mockReturnValue(true),
}));

// Recreate the conversion helpers
function toJson(data: unknown): any {
  if (data === null || data === undefined) {
    return null;
  }

  if (typeof data === 'object') {
    try {
      const serialized = JSON.stringify(data);
      return JSON.parse(serialized);
    } catch {
      return null;
    }
  }

  if (
    typeof data === 'string' ||
    typeof data === 'number' ||
    typeof data === 'boolean'
  ) {
    return data;
  }

  return null;
}

// Mock push methods - simplified versions for testing
class TestSyncService {
  constructor(private mockSupabase: any) {}

  async pushTripChange(change: any): Promise<void> {
    const table = 'trips';
    const data = change.data;

    switch (change.operation) {
      case 'create': {
        const result = await this.mockSupabase.from(table).insert({
          id: data.id,
          user_id: change.userId,
          title: data.title || 'Untitled Trip',
          description: data.description,
          days: toJson(data.days) || null,
          trip_events: toJson(data.tripEvents) || null,
          settings: toJson(data.settings) || null,
          version: change.version,
        });
        if (result.error) throw result.error;
        break;
      }

      case 'update': {
        const result = await this.mockSupabase
          .from(table)
          .update({
            title: data.title,
            description: data.description,
            days: toJson(data.days),
            trip_events: toJson(data.tripEvents),
            settings: toJson(data.settings),
            version: change.version,
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.entityId)
          .eq('user_id', change.userId);
        if (result.error) throw result.error;
        break;
      }

      case 'delete': {
        const result = await this.mockSupabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', change.entityId)
          .eq('user_id', change.userId);
        if (result.error) throw result.error;
        break;
      }
    }
  }

  async pushPersonChange(change: any): Promise<void> {
    const table = 'trip_people';
    const data = change.data;

    switch (change.operation) {
      case 'create': {
        const result = await this.mockSupabase.from(table).insert({
          trip_id: change.tripId,
          name: data.name,
          age: data.age,
          gender: data.gender,
          settings: toJson(data.settings),
          version: change.version,
        });
        if (result.error) throw result.error;
        break;
      }

      case 'update': {
        const result = await this.mockSupabase
          .from(table)
          .update({
            name: data.name,
            age: data.age,
            gender: data.gender,
            settings: toJson(data.settings),
            version: change.version,
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.entityId);
        if (result.error) throw result.error;
        break;
      }

      case 'delete': {
        const result = await this.mockSupabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', change.entityId);
        if (result.error) throw result.error;
        break;
      }
    }
  }

  async pushItemChange(change: any): Promise<void> {
    const table = 'trip_items';
    const data = change.data;

    switch (change.operation) {
      case 'create': {
        const result = await this.mockSupabase.from(table).insert({
          trip_id: change.tripId,
          name: data.name,
          category: data.category,
          quantity: data.quantity || 1,
          packed: data.packed || false,
          notes: data.notes,
          person_id: data.personId,
          day_index: data.dayIndex,
          version: change.version,
        });
        if (result.error) throw result.error;
        break;
      }

      case 'update': {
        const result = await this.mockSupabase
          .from(table)
          .update({
            name: data.name,
            category: data.category,
            quantity: data.quantity,
            packed: data.packed,
            notes: data.notes,
            person_id: data.personId,
            day_index: data.dayIndex,
            version: change.version,
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.entityId);
        if (result.error) throw result.error;
        break;
      }

      case 'delete': {
        const result = await this.mockSupabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', change.entityId);
        if (result.error) throw result.error;
        break;
      }
    }
  }

  async pushPackingStatusUpdate(change: any): Promise<void> {
    const data = change.data;
    const result = await this.mockSupabase
      .from('trip_items')
      .update({
        packed: data.packed,
        updated_at: data.updatedAt || new Date().toISOString(),
      })
      .eq('id', change.entityId);

    if (result.error) throw result.error;
  }

  async pushBulkPackingUpdate(change: any): Promise<void> {
    const data = change.data;
    const updates = data.changes;

    // Process bulk updates
    for (const update of updates) {
      const result = await this.mockSupabase
        .from('trip_items')
        .update({
          packed: update.packed,
          updated_at: data.updatedAt || new Date().toISOString(),
        })
        .eq('id', update.itemId);

      if (result.error) {
        console.error(`Failed to update item ${update.itemId}:`, result.error);
      }
    }
  }

  async pushRuleOverrideChange(change: any): Promise<void> {
    const table = 'trip_rule_overrides';
    const data = change.data;

    switch (change.operation) {
      case 'create': {
        const result = await this.mockSupabase.from(table).insert({
          trip_id: change.tripId || data.tripId,
          rule_id: data.ruleId,
          override_data: toJson(data),
          version: change.version,
        });
        if (result.error) throw result.error;
        break;
      }

      case 'update': {
        const result = await this.mockSupabase
          .from(table)
          .update({
            override_data: toJson(data),
            version: change.version,
            updated_at: new Date().toISOString(),
          })
          .eq('trip_id', change.tripId || data.tripId)
          .eq('rule_id', data.ruleId);
        if (result.error) throw result.error;
        break;
      }

      case 'delete': {
        const result = await this.mockSupabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('trip_id', change.tripId || data.tripId)
          .eq('rule_id', data.ruleId);
        if (result.error) throw result.error;
        break;
      }
    }
  }

  async pushRulePackChange(change: any): Promise<void> {
    const table = 'rule_packs';
    const data = change.data;

    switch (change.operation) {
      case 'create': {
        const result = await this.mockSupabase.from(table).insert({
          user_id: change.userId,
          pack_id: data.id,
          name: data.name,
          description: data.description,
          author: toJson(data.author),
          metadata: toJson(data.metadata),
          stats: toJson(data.stats),
          primary_category_id: data.primaryCategoryId,
          icon: data.icon,
          color: data.color,
          version: change.version,
        });
        if (result.error) throw result.error;
        break;
      }

      case 'update': {
        const result = await this.mockSupabase
          .from(table)
          .update({
            name: data.name,
            description: data.description,
            author: toJson(data.author),
            metadata: toJson(data.metadata),
            stats: toJson(data.stats),
            primary_category_id: data.primaryCategoryId,
            icon: data.icon,
            color: data.color,
            version: change.version,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', change.userId)
          .eq('pack_id', data.id);
        if (result.error) throw result.error;
        break;
      }

      case 'delete': {
        const result = await this.mockSupabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('user_id', change.userId)
          .eq('pack_id', data.id);
        if (result.error) throw result.error;
        break;
      }
    }
  }
}

describe('Push Operations', () => {
  let syncService: TestSyncService;

  beforeEach(() => {
    syncService = new TestSyncService(mockSupabase);
  });

  describe('Trip Push Operations', () => {
    it('should push trip creation correctly', async () => {
      const tripChange = {
        operation: 'create',
        entityId: 'trip-123',
        userId: 'user-456',
        version: 1,
        data: {
          id: 'trip-123',
          title: 'Summer Vacation',
          description: 'A fun summer trip',
          days: [{ date: '2024-07-01', activities: ['beach'] }],
          tripEvents: [{ type: 'departure', time: '10:00' }],
          settings: { notifications: true },
        },
      };

      await syncService.pushTripChange(tripChange);

      expect(mockSupabase.from).toHaveBeenCalledWith('trips');
      const mockTable = mockSupabase.from('trips');
      expect(mockTable.insert).toHaveBeenCalledWith({
        id: 'trip-123',
        user_id: 'user-456',
        title: 'Summer Vacation',
        description: 'A fun summer trip',
        days: [{ date: '2024-07-01', activities: ['beach'] }],
        trip_events: [{ type: 'departure', time: '10:00' }],
        settings: { notifications: true },
        version: 1,
      });
    });

    it('should push trip update correctly', async () => {
      const tripChange = {
        operation: 'update',
        entityId: 'trip-123',
        userId: 'user-456',
        version: 2,
        data: {
          id: 'trip-123',
          title: 'Updated Summer Vacation',
          description: 'Updated description',
          days: [],
          tripEvents: [],
          settings: { notifications: false },
        },
      };

      await syncService.pushTripChange(tripChange);

      expect(mockSupabase.from).toHaveBeenCalledWith('trips');
      const mockTable = mockSupabase.from('trips');
      expect(mockTable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Summer Vacation',
          description: 'Updated description',
          version: 2,
          updated_at: expect.any(String),
        })
      );
    });

    it('should push trip deletion correctly', async () => {
      const tripChange = {
        operation: 'delete',
        entityId: 'trip-123',
        userId: 'user-456',
        version: 3,
        data: null,
      };

      await syncService.pushTripChange(tripChange);

      expect(mockSupabase.from).toHaveBeenCalledWith('trips');
      const mockTable = mockSupabase.from('trips');
      expect(mockTable.update).toHaveBeenCalledWith({
        is_deleted: true,
        updated_at: expect.any(String),
      });
    });

    it('should handle trip with empty title', async () => {
      const tripChange = {
        operation: 'create',
        entityId: 'trip-123',
        userId: 'user-456',
        version: 1,
        data: {
          id: 'trip-123',
          title: '',
          days: [],
          tripEvents: [],
        },
      };

      await syncService.pushTripChange(tripChange);

      const mockTable = mockSupabase.from('trips');
      expect(mockTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Untitled Trip', // Should default to this
        })
      );
    });
  });

  describe('Person Push Operations', () => {
    it('should push person creation correctly', async () => {
      const personChange = {
        operation: 'create',
        entityId: 'person-123',
        userId: 'user-456',
        tripId: 'trip-789',
        version: 1,
        data: {
          name: 'John Doe',
          age: 30,
          gender: 'male',
          settings: { dietary: ['vegetarian'] },
        },
      };

      await syncService.pushPersonChange(personChange);

      expect(mockSupabase.from).toHaveBeenCalledWith('trip_people');
      const mockTable = mockSupabase.from('trip_people');
      expect(mockTable.insert).toHaveBeenCalledWith({
        trip_id: 'trip-789',
        name: 'John Doe',
        age: 30,
        gender: 'male',
        settings: { dietary: ['vegetarian'] },
        version: 1,
      });
    });

    it('should push person update correctly', async () => {
      const personChange = {
        operation: 'update',
        entityId: 'person-123',
        version: 2,
        data: {
          name: 'John Smith',
          age: 31,
          gender: 'male',
          settings: { dietary: ['vegan'] },
        },
      };

      await syncService.pushPersonChange(personChange);

      const mockTable = mockSupabase.from('trip_people');
      expect(mockTable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Smith',
          age: 31,
          gender: 'male',
          settings: { dietary: ['vegan'] },
          version: 2,
          updated_at: expect.any(String),
        })
      );
    });

    it('should push person deletion correctly', async () => {
      const personChange = {
        operation: 'delete',
        entityId: 'person-123',
        version: 3,
        data: null,
      };

      await syncService.pushPersonChange(personChange);

      const mockTable = mockSupabase.from('trip_people');
      expect(mockTable.update).toHaveBeenCalledWith({
        is_deleted: true,
        updated_at: expect.any(String),
      });
    });
  });

  describe('Item Push Operations', () => {
    it('should push item creation correctly', async () => {
      const itemChange = {
        operation: 'create',
        entityId: 'item-123',
        tripId: 'trip-789',
        version: 1,
        data: {
          name: 'T-shirt',
          category: 'clothing',
          quantity: 3,
          packed: false,
          notes: 'Cotton shirts',
          personId: 'person-456',
          dayIndex: 1,
        },
      };

      await syncService.pushItemChange(itemChange);

      expect(mockSupabase.from).toHaveBeenCalledWith('trip_items');
      const mockTable = mockSupabase.from('trip_items');
      expect(mockTable.insert).toHaveBeenCalledWith({
        trip_id: 'trip-789',
        name: 'T-shirt',
        category: 'clothing',
        quantity: 3,
        packed: false,
        notes: 'Cotton shirts',
        person_id: 'person-456',
        day_index: 1,
        version: 1,
      });
    });

    it('should push item update correctly', async () => {
      const itemChange = {
        operation: 'update',
        entityId: 'item-123',
        version: 2,
        data: {
          name: 'Blue T-shirt',
          category: 'clothing',
          quantity: 2,
          packed: true,
          notes: 'Blue cotton shirts',
          personId: 'person-456',
          dayIndex: 2,
        },
      };

      await syncService.pushItemChange(itemChange);

      const mockTable = mockSupabase.from('trip_items');
      expect(mockTable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Blue T-shirt',
          category: 'clothing',
          quantity: 2,
          packed: true,
          notes: 'Blue cotton shirts',
          person_id: 'person-456',
          day_index: 2,
          version: 2,
          updated_at: expect.any(String),
        })
      );
    });

    it('should use default values for missing item fields', async () => {
      const itemChange = {
        operation: 'create',
        entityId: 'item-123',
        tripId: 'trip-789',
        version: 1,
        data: {
          name: 'Item without defaults',
          category: 'misc',
          // quantity and packed missing
        },
      };

      await syncService.pushItemChange(itemChange);

      const mockTable = mockSupabase.from('trip_items');
      expect(mockTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 1, // default
          packed: false, // default
        })
      );
    });
  });

  describe('Packing Status Operations', () => {
    it('should push individual packing status update', async () => {
      const packingChange = {
        entityId: 'item-123',
        data: {
          id: 'item-123',
          packed: true,
          updatedAt: '2024-01-01T10:00:00Z',
          _packingStatusOnly: true,
        },
      };

      await syncService.pushPackingStatusUpdate(packingChange);

      expect(mockSupabase.from).toHaveBeenCalledWith('trip_items');
      const mockTable = mockSupabase.from('trip_items');
      expect(mockTable.update).toHaveBeenCalledWith({
        packed: true,
        updated_at: '2024-01-01T10:00:00Z',
      });
    });

    it('should push bulk packing update', async () => {
      const bulkChange = {
        data: {
          bulkPackingUpdate: true,
          changes: [
            { itemId: 'item-1', packed: true },
            { itemId: 'item-2', packed: false },
            { itemId: 'item-3', packed: true },
          ],
          updatedAt: '2024-01-01T10:00:00Z',
        },
      };

      await syncService.pushBulkPackingUpdate(bulkChange);

      expect(mockSupabase.from).toHaveBeenCalledWith('trip_items');
      // Should have been called 3 times for each item
      const mockTable = mockSupabase.from('trip_items');
      expect(mockTable.update).toHaveBeenCalledTimes(3);

      // Check each call
      expect(mockTable.update).toHaveBeenNthCalledWith(1, {
        packed: true,
        updated_at: '2024-01-01T10:00:00Z',
      });
      expect(mockTable.update).toHaveBeenNthCalledWith(2, {
        packed: false,
        updated_at: '2024-01-01T10:00:00Z',
      });
      expect(mockTable.update).toHaveBeenNthCalledWith(3, {
        packed: true,
        updated_at: '2024-01-01T10:00:00Z',
      });
    });
  });

  describe('Rule Override Operations', () => {
    it('should push rule override creation', async () => {
      const ruleOverrideChange = {
        operation: 'create',
        userId: 'user-123',
        tripId: 'trip-456',
        version: 1,
        data: {
          ruleId: 'rule-789',
          tripId: 'trip-456',
          overrideValue: 5,
          conditions: { temperature: 'hot' },
        },
      };

      await syncService.pushRuleOverrideChange(ruleOverrideChange);

      expect(mockSupabase.from).toHaveBeenCalledWith('trip_rule_overrides');
      const mockTable = mockSupabase.from('trip_rule_overrides');
      expect(mockTable.insert).toHaveBeenCalledWith({
        trip_id: 'trip-456',
        rule_id: 'rule-789',
        override_data: {
          ruleId: 'rule-789',
          tripId: 'trip-456',
          overrideValue: 5,
          conditions: { temperature: 'hot' },
        },
        version: 1,
      });
    });

    it('should push rule override update', async () => {
      const ruleOverrideChange = {
        operation: 'update',
        tripId: 'trip-456',
        version: 2,
        data: {
          ruleId: 'rule-789',
          tripId: 'trip-456',
          overrideValue: 7,
          conditions: { temperature: 'cold' },
        },
      };

      await syncService.pushRuleOverrideChange(ruleOverrideChange);

      const mockTable = mockSupabase.from('trip_rule_overrides');
      expect(mockTable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          override_data: expect.objectContaining({
            overrideValue: 7,
            conditions: { temperature: 'cold' },
          }),
          version: 2,
          updated_at: expect.any(String),
        })
      );
    });
  });

  describe('Rule Pack Operations', () => {
    it('should push rule pack creation', async () => {
      const rulePackChange = {
        operation: 'create',
        userId: 'user-123',
        version: 1,
        data: {
          id: 'pack-456',
          name: 'Travel Essentials',
          description: 'Essential travel items',
          author: { name: 'Travel Expert', email: 'expert@travel.com' },
          metadata: { category: 'travel', tags: ['essential'] },
          stats: { downloads: 0, rating: 0 },
          rules: [],
          primaryCategoryId: 'cat-clothing',
          icon: 'suitcase',
          color: 'blue',
        },
      };

      await syncService.pushRulePackChange(rulePackChange);

      expect(mockSupabase.from).toHaveBeenCalledWith('rule_packs');
      const mockTable = mockSupabase.from('rule_packs');
      expect(mockTable.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        pack_id: 'pack-456',
        name: 'Travel Essentials',
        description: 'Essential travel items',
        author: { name: 'Travel Expert', email: 'expert@travel.com' },
        metadata: { category: 'travel', tags: ['essential'] },
        stats: { downloads: 0, rating: 0 },
        primary_category_id: 'cat-clothing',
        icon: 'suitcase',
        color: 'blue',
        version: 1,
      });
    });

    it('should push rule pack update', async () => {
      const rulePackChange = {
        operation: 'update',
        userId: 'user-123',
        version: 2,
        data: {
          id: 'pack-456',
          name: 'Updated Travel Essentials',
          description: 'Updated description',
          author: { name: 'Travel Expert', email: 'expert@travel.com' },
          metadata: { category: 'travel', tags: ['essential', 'updated'] },
          stats: { downloads: 10, rating: 4.5 },
          rules: [],
          primaryCategoryId: 'cat-clothing',
          icon: 'luggage',
          color: 'green',
        },
      };

      await syncService.pushRulePackChange(rulePackChange);

      const mockTable = mockSupabase.from('rule_packs');
      expect(mockTable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Travel Essentials',
          description: 'Updated description',
          metadata: { category: 'travel', tags: ['essential', 'updated'] },
          stats: { downloads: 10, rating: 4.5 },
          icon: 'luggage',
          color: 'green',
          version: 2,
          updated_at: expect.any(String),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error when Supabase returns error', async () => {
      // Mock an error response
      const errorResponse = { error: { message: 'Database error' } };
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue(errorResponse),
        update: vi.fn(),
      });

      const tripChange = {
        operation: 'create',
        entityId: 'trip-123',
        userId: 'user-456',
        version: 1,
        data: {
          id: 'trip-123',
          title: 'Test Trip',
          days: [],
          tripEvents: [],
        },
      };

      await expect(syncService.pushTripChange(tripChange)).rejects.toEqual({
        message: 'Database error',
      });
    });

    it('should handle missing tripId gracefully', async () => {
      const personChange = {
        operation: 'create',
        entityId: 'person-123',
        userId: 'user-456',
        // tripId missing
        version: 1,
        data: {
          name: 'John Doe',
          age: 30,
          gender: 'male',
        },
      };

      await syncService.pushPersonChange(personChange);

      const mockTable = mockSupabase.from('trip_people');
      expect(mockTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          trip_id: undefined, // Should be passed as undefined
        })
      );
    });
  });

  describe('Data Conversion in Push Operations', () => {
    it('should properly convert complex objects to JSON', async () => {
      const tripChange = {
        operation: 'create',
        entityId: 'trip-123',
        userId: 'user-456',
        version: 1,
        data: {
          id: 'trip-123',
          title: 'Complex Trip',
          days: [
            {
              date: '2024-07-01',
              activities: ['beach', 'dinner'],
              weather: { temp: 25, conditions: 'sunny' },
            },
          ],
          tripEvents: [
            { type: 'departure', time: '10:00', location: 'airport' },
          ],
          settings: {
            notifications: true,
            privacy: 'private',
            preferences: {
              temperature: 'celsius',
              currency: 'USD',
            },
          },
        },
      };

      await syncService.pushTripChange(tripChange);

      const mockTable = mockSupabase.from('trips');
      expect(mockTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          days: expect.arrayContaining([
            expect.objectContaining({
              date: '2024-07-01',
              activities: ['beach', 'dinner'],
              weather: { temp: 25, conditions: 'sunny' },
            }),
          ]),
          trip_events: expect.arrayContaining([
            expect.objectContaining({
              type: 'departure',
              time: '10:00',
              location: 'airport',
            }),
          ]),
          settings: expect.objectContaining({
            notifications: true,
            privacy: 'private',
            preferences: {
              temperature: 'celsius',
              currency: 'USD',
            },
          }),
        })
      );
    });

    it('should handle null/undefined values in data conversion', async () => {
      const tripChange = {
        operation: 'create',
        entityId: 'trip-123',
        userId: 'user-456',
        version: 1,
        data: {
          id: 'trip-123',
          title: 'Trip with nulls',
          description: null,
          days: undefined,
          tripEvents: null,
          settings: undefined,
        },
      };

      await syncService.pushTripChange(tripChange);

      const mockTable = mockSupabase.from('trips');
      expect(mockTable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
          days: null, // undefined converted to null
          trip_events: null,
          settings: null, // undefined converted to null
        })
      );
    });
  });
});
