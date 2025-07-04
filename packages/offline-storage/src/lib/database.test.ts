import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeDatabase, closeDatabase, getDatabase } from './database.js';

describe('database', () => {
  beforeEach(async () => {
    await initializeDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('initializes with required stores', async () => {
    const db = await getDatabase();
    expect(db.objectStoreNames.contains('trips')).toBe(true);
    expect(db.objectStoreNames.contains('userPreferences')).toBe(true);
  });

  it('returns same instance on repeated calls', async () => {
    const db1 = await getDatabase();
    const db2 = await getDatabase();
    expect(db1).toBe(db2);
  });
});
