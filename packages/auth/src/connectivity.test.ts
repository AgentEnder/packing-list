import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConnectivityService, getConnectivityService } from './connectivity.js';

// Mock navigator and window
const mockNavigator = {
  onLine: true,
};

const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setInterval: vi.fn(() => 123), // Mock interval ID
  clearInterval: vi.fn(),
};

describe('ConnectivityService', () => {
  let service: ConnectivityService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock global objects
    Object.defineProperty(globalThis, 'navigator', {
      writable: true,
      value: mockNavigator,
    });

    Object.defineProperty(globalThis, 'window', {
      writable: true,
      value: mockWindow,
    });

    // Reset navigator.onLine to true for each test
    mockNavigator.onLine = true;
  });

  afterEach(() => {
    if (service) {
      service.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      service = new ConnectivityService();
      const state = service.getState();

      expect(state.isOnline).toBe(true);
      expect(state.isConnected).toBe(true);
    });

    it('should set up event listeners for online/offline events', () => {
      service = new ConnectivityService();

      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );
    });

    it('should start periodic connectivity checks', () => {
      service = new ConnectivityService();

      expect(mockWindow.setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        300000 // 5 minutes
      );
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      service = new ConnectivityService();
    });

    it('should return current state', () => {
      const state = service.getState();

      expect(state).toHaveProperty('isOnline');
      expect(state).toHaveProperty('isConnected');
      expect(typeof state.isOnline).toBe('boolean');
      expect(typeof state.isConnected).toBe('boolean');
    });

    it('should notify listeners when state changes', () => {
      const listener = vi.fn();
      service.subscribe(listener);

      // Clear the initial call
      listener.mockClear();

      // Simulate going offline
      mockNavigator.onLine = false;
      const handleOffline = mockWindow.addEventListener.mock.calls.find(
        (call) => call[0] === 'offline'
      )?.[1];

      if (handleOffline) {
        handleOffline();
      }

      expect(listener).toHaveBeenCalled();
    });

    it('should immediately call listener with current state on subscription', () => {
      const listener = vi.fn();
      service.subscribe(listener);

      expect(listener).toHaveBeenCalledWith(service.getState());
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      service = new ConnectivityService();
    });

    it('should allow multiple subscribers', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      service.subscribe(listener1);
      service.subscribe(listener2);

      // Both should be called immediately
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');

      // Clear initial call
      listener.mockClear();

      // Unsubscribe
      unsubscribe();

      // Simulate state change
      mockNavigator.onLine = false;
      const handleOffline = mockWindow.addEventListener.mock.calls.find(
        (call) => call[0] === 'offline'
      )?.[1];

      if (handleOffline) {
        handleOffline();
      }

      // Listener should not be called after unsubscribe
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Online/Offline Handling', () => {
    beforeEach(() => {
      service = new ConnectivityService();
    });

    it('should handle online event', () => {
      const listener = vi.fn();
      service.subscribe(listener);
      listener.mockClear(); // Clear initial call

      // Simulate going online
      mockNavigator.onLine = true;
      const handleOnline = mockWindow.addEventListener.mock.calls.find(
        (call) => call[0] === 'online'
      )?.[1];

      if (handleOnline) {
        handleOnline();
      }

      const state = service.getState();
      expect(state.isOnline).toBe(true);
      expect(state.isConnected).toBe(true);
    });

    it('should handle offline event', () => {
      const listener = vi.fn();
      service.subscribe(listener);
      listener.mockClear(); // Clear initial call

      // Simulate going offline
      mockNavigator.onLine = false;
      const handleOffline = mockWindow.addEventListener.mock.calls.find(
        (call) => call[0] === 'offline'
      )?.[1];

      if (handleOffline) {
        handleOffline();
      }

      const state = service.getState();
      expect(state.isOnline).toBe(false);
      expect(state.isConnected).toBe(false);
    });
  });

  describe('Manual Connectivity Check', () => {
    beforeEach(() => {
      service = new ConnectivityService();
    });

    it('should provide manual check method', async () => {
      const state = await service.checkNow();

      expect(state).toHaveProperty('isOnline');
      expect(state).toHaveProperty('isConnected');
      expect(state).toEqual(service.getState());
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      service = new ConnectivityService();
    });

    it('should clean up event listeners on destroy', () => {
      service.destroy();

      expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );
    });

    it('should clear interval on destroy', () => {
      // Verify interval was created
      expect(mockWindow.setInterval).toHaveBeenCalled();

      service.destroy();

      expect(mockWindow.clearInterval).toHaveBeenCalledWith(123);
    });

    it('should clear listeners on destroy', () => {
      const listener = vi.fn();
      service.subscribe(listener);
      listener.mockClear();

      service.destroy();

      // Try to trigger a state change - listener should not be called
      mockNavigator.onLine = false;
      const handleOffline = mockWindow.addEventListener.mock.calls.find(
        (call) => call[0] === 'offline'
      )?.[1];

      if (handleOffline) {
        handleOffline();
      }

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('SSR Compatibility', () => {
    it('should handle missing navigator gracefully', () => {
      // Store original navigator
      const originalNavigator = globalThis.navigator;

      // Remove navigator
      Object.defineProperty(globalThis, 'navigator', {
        writable: true,
        value: undefined,
      });

      service = new ConnectivityService();
      const state = service.getState();

      expect(state.isOnline).toBe(true); // Default to true for SSR
      expect(state.isConnected).toBe(true);

      // Restore navigator
      Object.defineProperty(globalThis, 'navigator', {
        writable: true,
        value: originalNavigator,
      });
    });

    it('should handle missing window gracefully', () => {
      // Store original window
      const originalWindow = globalThis.window;

      // Remove window
      Object.defineProperty(globalThis, 'window', {
        writable: true,
        value: undefined,
      });

      // Should not throw
      expect(() => {
        service = new ConnectivityService();
      }).not.toThrow();

      // Restore window
      Object.defineProperty(globalThis, 'window', {
        writable: true,
        value: originalWindow,
      });
    });
  });
});

describe('getConnectivityService', () => {
  afterEach(() => {
    // Clean up any created services
    vi.restoreAllMocks();
  });

  it('should return singleton instance for same URL', () => {
    const service1 = getConnectivityService('test-url');
    const service2 = getConnectivityService('test-url');

    expect(service1).toBe(service2);
  });

  it('should return different instances for different URLs', () => {
    const service1 = getConnectivityService('url1');
    const service2 = getConnectivityService('url2');

    expect(service1).not.toBe(service2);
  });

  it('should use default key when no URL provided', () => {
    const service1 = getConnectivityService();
    const service2 = getConnectivityService();

    expect(service1).toBe(service2);
  });
});
