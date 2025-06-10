import indexeddb from 'fake-indexeddb';

(globalThis as unknown as { indexedDB: typeof indexeddb }).indexedDB =
  indexeddb;
