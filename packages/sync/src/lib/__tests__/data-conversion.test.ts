import { Json } from '@packing-list/supabase';
import { describe, it, expect } from 'vitest';

// Recreate the conversion functions for testing
function toJson(data: unknown): Json {
  if (data === null || data === undefined) {
    return null;
  }

  // For complex objects, we need to ensure they're serializable as Json
  if (typeof data === 'object') {
    try {
      // Test if it can be serialized and parsed
      const serialized = JSON.stringify(data);
      return JSON.parse(serialized);
    } catch {
      // If serialization fails, return null
      return null;
    }
  }

  // Primitive types that are valid Json
  if (
    typeof data === 'string' ||
    typeof data === 'number' ||
    typeof data === 'boolean'
  ) {
    return data;
  }

  return null;
}

function fromJson<T>(json: Json): T {
  // Simple cast since we trust the database to have valid data
  return json as unknown as T;
}

describe('Data Conversion Functions', () => {
  describe('toJson', () => {
    it('should handle null and undefined', () => {
      expect(toJson(null)).toBe(null);
      expect(toJson(undefined)).toBe(null);
    });

    it('should handle primitive types', () => {
      expect(toJson('string')).toBe('string');
      expect(toJson(123)).toBe(123);
      expect(toJson(true)).toBe(true);
      expect(toJson(false)).toBe(false);
    });

    it('should handle simple objects', () => {
      const obj = { name: 'John', age: 30 };
      expect(toJson(obj)).toEqual(obj);
    });

    it('should handle arrays', () => {
      const arr = [1, 2, 3, 'test'];
      expect(toJson(arr)).toEqual(arr);
    });

    it('should handle nested objects', () => {
      const nested = {
        user: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        items: ['item1', 'item2'],
      };
      expect(toJson(nested)).toEqual(nested);
    });

    it('should handle objects with methods (should serialize without methods)', () => {
      const objWithMethod = {
        name: 'John',
        getName() {
          return this.name;
        },
      };

      const result = toJson(objWithMethod);
      expect(result).toEqual({ name: 'John' });
      expect(
        (result as unknown as Record<string, unknown>)['getName']
      ).toBeUndefined();
    });

    it('should handle circular references gracefully', () => {
      const circularObj: { name: string; self: unknown } = {
        name: 'John',
        self: null,
      };
      circularObj.self = circularObj;

      // Should return null for objects that can't be serialized
      expect(toJson(circularObj)).toBe(null);
    });

    it('should handle dates by converting to string', () => {
      const date = new Date('2024-01-01');
      const result = toJson(date);
      expect(typeof result).toBe('string');
      expect(result).toBe(date.toISOString());
    });

    it('should handle complex valid objects', () => {
      const complexObj = {
        id: 'test-123',
        name: 'Test Item',
        metadata: {
          version: 1,
          tags: ['tag1', 'tag2'],
          options: {
            enabled: true,
            priority: 5,
          },
        },
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
      };

      expect(toJson(complexObj)).toEqual(complexObj);
    });

    it('should handle invalid types by returning null', () => {
      const symbol = Symbol('test');
      const func = () => 'test';

      expect(toJson(symbol)).toBe(null);
      expect(toJson(func)).toBe(null);
    });

    it('should handle objects with undefined values', () => {
      const objWithUndefined = {
        name: 'John',
        undefinedValue: undefined,
        nullValue: null,
      };

      const result = toJson(objWithUndefined);
      // JSON.stringify removes undefined values but keeps null
      expect(result).toEqual({
        name: 'John',
        nullValue: null,
      });
      expect('undefinedValue' in (result as object)).toBe(false);
    });
  });

  describe('fromJson', () => {
    it('should convert simple values', () => {
      expect(fromJson<string>('test')).toBe('test');
      expect(fromJson<number>(123)).toBe(123);
      expect(fromJson<boolean>(true)).toBe(true);
    });

    it('should convert objects', () => {
      const obj = { name: 'John', age: 30 };
      const result = fromJson<typeof obj>(obj);
      expect(result).toEqual(obj);
      expect(result.name).toBe('John');
      expect(result.age).toBe(30);
    });

    it('should convert arrays', () => {
      const arr = [1, 2, 3];
      const result = fromJson<number[]>(arr);
      expect(result).toEqual(arr);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should convert complex nested structures', () => {
      interface ComplexType {
        user: {
          name: string;
          settings: {
            theme: string;
            enabled: boolean;
          };
        };
        items: string[];
      }

      const complex = {
        user: {
          name: 'John',
          settings: {
            theme: 'dark',
            enabled: true,
          },
        },
        items: ['item1', 'item2'],
      };

      const result = fromJson<ComplexType>(complex);
      expect(result.user.name).toBe('John');
      expect(result.user.settings.theme).toBe('dark');
      expect(result.items).toEqual(['item1', 'item2']);
    });

    it('should handle null values', () => {
      expect(fromJson<string | null>(null)).toBe(null);
    });

    it('should preserve type information through conversion', () => {
      interface Person {
        name: string;
        age: number;
        active: boolean;
      }

      const person = { name: 'John', age: 30, active: true };
      const jsonified = toJson(person);
      const restored = fromJson<Person>(jsonified);

      expect(restored.name).toBe('John');
      expect(restored.age).toBe(30);
      expect(restored.active).toBe(true);
      expect(typeof restored.name).toBe('string');
      expect(typeof restored.age).toBe('number');
      expect(typeof restored.active).toBe('boolean');
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve data through toJson -> fromJson cycle', () => {
      const testCases = [
        { name: 'John', age: 30 },
        ['item1', 'item2', 'item3'],
        { nested: { deep: { value: 'test' } } },
        { mixed: ['string', 123, true, null] },
        null,
        'simple string',
        42,
        true,
      ];

      testCases.forEach((testCase) => {
        const jsonified = toJson(testCase);
        const restored = fromJson(jsonified);
        expect(restored).toEqual(testCase);
      });
    });

    it('should handle model types correctly', () => {
      interface Trip {
        id: string;
        title: string;
        days: Array<{ date: string; activities: string[] }>;
        settings: {
          notifications: boolean;
          privacy: 'public' | 'private';
        };
      }

      const trip: Trip = {
        id: 'trip-123',
        title: 'Summer Vacation',
        days: [
          { date: '2024-07-01', activities: ['beach', 'dinner'] },
          { date: '2024-07-02', activities: ['hiking'] },
        ],
        settings: {
          notifications: true,
          privacy: 'private',
        },
      };

      const jsonified = toJson(trip);
      const restored = fromJson<Trip>(jsonified);

      expect(restored.id).toBe(trip.id);
      expect(restored.title).toBe(trip.title);
      expect(restored.days).toEqual(trip.days);
      expect(restored.settings).toEqual(trip.settings);
    });

    it('should handle person data correctly', () => {
      interface Person {
        id: string;
        name: string;
        age: number;
        gender: string;
        settings?: {
          dietary: string[];
          preferences: Record<string, unknown>;
        };
      }

      const person: Person = {
        id: 'person-123',
        name: 'John Doe',
        age: 30,
        gender: 'male',
        settings: {
          dietary: ['vegetarian', 'gluten-free'],
          preferences: {
            temperature: 'warm',
            activities: ['hiking', 'reading'],
          },
        },
      };

      const jsonified = toJson(person);
      const restored = fromJson<Person>(jsonified);

      expect(restored).toEqual(person);
      expect(restored.settings?.dietary).toEqual(person.settings?.dietary);
    });

    it('should handle rule pack data correctly', () => {
      interface RulePackAuthor {
        name: string;
        email: string;
        website?: string;
      }

      interface RulePack {
        id: string;
        name: string;
        description: string;
        author: RulePackAuthor;
        rules: Array<{ id: string; name: string; calculation: unknown }>;
        metadata: Record<string, unknown>;
      }

      const rulePack: RulePack = {
        id: 'pack-123',
        name: 'Travel Essentials',
        description: 'Essential items for travel',
        author: {
          name: 'Travel Expert',
          email: 'expert@travel.com',
          website: 'https://travel.expert',
        },
        rules: [
          {
            id: 'rule-1',
            name: 'T-shirts',
            calculation: { type: 'days', multiplier: 1 },
          },
          {
            id: 'rule-2',
            name: 'Socks',
            calculation: { type: 'days', multiplier: 1.5 },
          },
        ],
        metadata: {
          version: '1.0',
          category: 'clothing',
          tags: ['essential', 'clothing'],
        },
      };

      const jsonified = toJson(rulePack);
      const restored = fromJson<RulePack>(jsonified);

      expect(restored).toEqual(rulePack);
      expect(restored.author).toEqual(rulePack.author);
      expect(restored.rules).toEqual(rulePack.rules);
      expect(restored.metadata).toEqual(rulePack.metadata);
    });
  });
});
