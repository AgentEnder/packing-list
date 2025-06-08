import { offlineStorage } from './offline-storage.js';

describe('offlineStorage', () => {
  it('should work', () => {
    expect(offlineStorage()).toEqual('offline-storage');
  });
});
