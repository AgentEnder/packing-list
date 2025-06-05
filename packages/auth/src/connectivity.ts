export interface ConnectivityState {
  isOnline: boolean;
  isConnected: boolean; // More specific check for auth service connectivity
}

export class ConnectivityService {
  private listeners: Array<(state: ConnectivityState) => void> = [];
  private currentState: ConnectivityState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true, // Default to true for SSR
    isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true, // Assume connected initially
  };
  private checkInterval: number | null = null;
  private authServiceUrl: string;

  constructor(authServiceUrl?: string) {
    this.authServiceUrl = authServiceUrl || '';
    this.initializeConnectivity();
  }

  private initializeConnectivity() {
    // Listen for browser online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnlineStatusChange);
      window.addEventListener('offline', this.handleOnlineStatusChange);
    }

    // Start periodic connectivity checks
    this.startPeriodicCheck();

    // Initial check
    this.checkConnectivity();
  }

  private handleOnlineStatusChange = () => {
    this.updateOnlineStatus(navigator.onLine);
    // When status changes, immediately check auth service connectivity
    this.checkConnectivity();
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

  private async checkConnectivity() {
    if (typeof window === 'undefined') {
      this.updateConnectedStatus(false);
      return;
    }

    if (!this.currentState.isOnline) {
      this.updateConnectedStatus(false);
      return;
    }

    try {
      // Try to reach the auth service or a simple endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      let testUrl = '/ping'; // Default fallback

      if (this.authServiceUrl) {
        try {
          const url = new URL(this.authServiceUrl);
          testUrl = `${url.origin}/ping`;
        } catch {
          // If authServiceUrl is invalid, try a simple connectivity test
          testUrl = 'https://httpbin.org/status/200';
        }
      } else {
        // Fallback connectivity test
        testUrl = 'https://httpbin.org/status/200';
      }

      await fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors', // Avoid CORS issues for simple connectivity test
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      this.updateConnectedStatus(true);
    } catch (error) {
      // If the specific service check fails, try a simpler connectivity test
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-cache',
        });

        clearTimeout(timeoutId);
        // We can reach the internet, but maybe not our auth service
        this.updateConnectedStatus(false);
      } catch {
        // No internet connectivity at all
        this.updateConnectedStatus(false);
      }
    }
  }

  private startPeriodicCheck() {
    if (typeof window === 'undefined') return;
    // Check connectivity every 30 seconds
    this.checkInterval = window.setInterval(() => {
      this.checkConnectivity();
    }, 30000);
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

  // Manual connectivity check
  async checkNow(): Promise<ConnectivityState> {
    await this.checkConnectivity();
    return this.currentState;
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnlineStatusChange);
      window.removeEventListener('offline', this.handleOnlineStatusChange);
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.listeners = [];
  }
}
