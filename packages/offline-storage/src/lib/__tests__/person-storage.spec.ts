import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersonStorage } from '../person-storage.js';
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

describe('PersonStorage', () => {
  it('should save person', async () => {
    const person = { id: 'p1', name: 'Alice' } as any;
    await PersonStorage.savePerson(person);
    expect(transaction).toHaveBeenCalledWith(['tripPeople'], 'readwrite');
    expect(objectStore).toHaveBeenCalledWith('tripPeople');
    expect(put).toHaveBeenCalledWith(person);
  });

  it('should soft delete person if found', async () => {
    get.mockResolvedValue({ id: 'p1', version: 1 } as any);
    await PersonStorage.deletePerson('p1');
    expect(get).toHaveBeenCalledWith('p1');
    expect(put).toHaveBeenCalled();
  });

  it('should get trip people and filter deleted', async () => {
    indexGetAll.mockResolvedValue([
      { id: 'a', isDeleted: false },
      { id: 'b', isDeleted: true },
    ] as any);
    const result = await PersonStorage.getTripPeople('trip1');
    expect(indexGetAll).toHaveBeenCalledWith('trip1');
    expect(result).toEqual([{ id: 'a', isDeleted: false }]);
  });
});
