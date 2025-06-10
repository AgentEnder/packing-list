import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ItemStorage } from '../item-storage.js';
import { getDatabase } from '../database.js';

vi.mock('../database.js', () => ({
  getDatabase: vi.fn(),
}));

const put = vi.fn();
const get = vi.fn();
const indexGetAll = vi.fn();
const objectStore = vi.fn(() => ({
  put,
  get,
  index: vi.fn(() => ({ getAll: indexGetAll })),
}));
const tx = { objectStore, done: Promise.resolve() };
const transaction = vi.fn(() => tx);

beforeEach(() => {
  put.mockReset();
  get.mockReset();
  indexGetAll.mockReset();
  objectStore.mockClear();
  transaction.mockClear();
  (getDatabase as unknown as vi.Mock).mockResolvedValue({ transaction });
});

describe('ItemStorage', () => {
  it('should save item', async () => {
    const item = { id: 'i1', name: 'Item 1' } as any;
    await ItemStorage.saveItem(item);
    expect(transaction).toHaveBeenCalledWith(['tripItems'], 'readwrite');
    expect(objectStore).toHaveBeenCalledWith('tripItems');
    expect(put).toHaveBeenCalledWith(item);
  });

  it('should soft delete item if found', async () => {
    get.mockResolvedValue({ id: 'i1', version: 1 } as any);
    await ItemStorage.deleteItem('i1');
    expect(get).toHaveBeenCalledWith('i1');
    expect(put).toHaveBeenCalled();
  });

  it('should get trip items and filter deleted', async () => {
    indexGetAll.mockResolvedValue([
      { id: 'a', isDeleted: false },
      { id: 'b', isDeleted: true },
    ] as any);
    const result = await ItemStorage.getTripItems('trip1');
    expect(indexGetAll).toHaveBeenCalledWith('trip1');
    expect(result).toEqual([{ id: 'a', isDeleted: false }]);
  });
});
