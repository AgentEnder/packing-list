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
    // Set navigator.onLine to false before initializing the service
    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      value: { onLine: false },
    });

    const connectivity = getConnectivityService();
    const service = await initializeSyncService();
    
    // Force an immediate connectivity check by bypassing throttling
    await (connectivity as any).checkConnectivity();
    const offlineState = await service.getSyncState();
    expect(offlineState.isOnline).toBe(false);

    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      value: { onLine: true },
    });
    
    // Force another immediate connectivity check
    await (connectivity as any).checkConnectivity();
    const onlineState = await service.getSyncState();
    expect(onlineState.isOnline).toBe(true);
  });
});