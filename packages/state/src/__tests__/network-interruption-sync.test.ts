import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getConnectivityService } from '@packing-list/connectivity';
import {
  initializeSyncService,
  resetSyncService,
} from '../lib/sync/sync-service.js';

beforeEach(() => {
  resetSyncService();
});

afterEach(() => {
  resetSyncService();
});

describe('Sync service network interruptions', () => {
  it('updates online status when connectivity changes', async () => {
    const connectivity = getConnectivityService();
    const service = await initializeSyncService();
    let lastOnline = service.getSyncState().then((s) => s.isOnline);
    await service.getSyncState();

    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      value: { onLine: false },
    });
    await connectivity.checkNow();
    const offlineState = await service.getSyncState();
    expect(offlineState.isOnline).toBe(false);

    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      value: { onLine: true },
    });
    await connectivity.checkNow();
    const onlineState = await service.getSyncState();
    expect(onlineState.isOnline).toBe(true);
  });
});
