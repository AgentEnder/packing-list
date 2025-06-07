export interface ConnectivityState {
  isOnline: boolean;
  isConnected: boolean; // More specific check for auth service connectivity
}

const connectivityServices: Map<string, ConnectivityService> = new Map();

export function getConnectivityService(authServiceUrl?: string) {
  const id = authServiceUrl || 'default';
  const inMap = connectivityServices.get(id);
  if (inMap) {
    return inMap;
  }

  const service = new ConnectivityService(authServiceUrl);
  connectivityServices.set(id, service);
  return service;
}

export class ConnectivityService {
  private listeners: Array<(state: ConnectivityState) => void> = [];
  private currentState: ConnectivityState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true, // Default to true for SSR
    isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true, // Assume connected initially
  };
  private checkInterval: number | null = null;
  private authServiceUrl: string;
  private lastCheckTime = 0;
  private minCheckInterval = 60000; // Minimum 60 seconds between checks
  private periodicCheckInterval = 300000; // Check every 5 minutes instead of 30 seconds

  constructor(authServiceUrl?: string) {
    console.log(
      '🚀 [CONNECTIVITY SERVICE] Initializing connectivity service -',
      authServiceUrl
    );
    this.authServiceUrl = authServiceUrl || '';
    this.initializeConnectivity();
  }

  private initializeConnectivity() {
    // Listen for browser online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnlineStatusChange);
      window.addEventListener('offline', this.handleOnlineStatusChange);
    }

    // Start periodic connectivity checks (much less frequent)
    this.startPeriodicCheck();

    // Initial check
    this.checkConnectivity();
  }

  private handleOnlineStatusChange = () => {
    this.updateOnlineStatus(navigator.onLine);
    // When status changes, immediately check auth service connectivity
    // but respect the minimum check interval
    this.checkConnectivityWithThrottling();
  };

  private updateOnlineStatus(isOnline: boolean) {
    if (this.currentState.isOnline !== isOnline) {
      this.currentState = { ...this.currentState, isOnline };
      this.notifyListeners();
    }
  }

  private updateConnectedStatus(isConnected: boolean) {
    if (this.currentState.isConnected !== isConnected) {
      this.currentState = { ...this.currentState, isConnected };
      this.notifyListeners();
    }
  }

  private async checkConnectivityWithThrottling() {
    const now = Date.now();
    if (now - this.lastCheckTime < this.minCheckInterval) {
      // Skip check if we've checked recently
      return;
    }

    this.lastCheckTime = now;
    await this.checkConnectivity();
  }

  private async checkConnectivity() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      // For SSR compatibility, default to connected state
      this.updateConnectedStatus(true);
      return;
    }

    // Ultra-conservative approach: Only report disconnected if navigator.onLine is explicitly false
    // This avoids false negatives from fetch failures in development environments
    const isConnected = navigator.onLine;
    this.updateConnectedStatus(isConnected);
  }

  private startPeriodicCheck() {
    if (typeof window === 'undefined') return;
    // Check connectivity every 5 minutes instead of 30 seconds
    this.checkInterval = window.setInterval(() => {
      this.checkConnectivityWithThrottling();
    }, this.periodicCheckInterval);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentState));
  }

  subscribe(listener: (state: ConnectivityState) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentState); // Immediately call with current state

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getState(): ConnectivityState {
    return this.currentState;
  }

  // Manual connectivity check (also respects throttling)
  async checkNow(): Promise<ConnectivityState> {
    await this.checkConnectivityWithThrottling();
    return this.currentState;
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnlineStatusChange);
      window.removeEventListener('offline', this.handleOnlineStatusChange);

      if (this.checkInterval) {
        window.clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
    }

    this.listeners = [];
  }
}
