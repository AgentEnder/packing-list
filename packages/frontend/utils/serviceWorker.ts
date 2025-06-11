// Service Worker Registration and Version Management

export interface VersionInfo {
  version: string;
  buildHash: string;
  buildTime: string;
  environment: string;
  timestamp: number;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private currentVersion: VersionInfo | null = null;
  private isDevelopment = import.meta.env.DEV;

  /**
   * Initialize service worker and start version checking
   */
  async init(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('🚫 Service Worker: Not supported in this browser');
      return;
    }

    try {
      console.log(
        `🔧 Service Worker: Initializing in ${
          this.isDevelopment ? 'development' : 'production'
        } mode`
      );

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('✅ Service Worker: Registered successfully');

      // Set up update checking
      this.setupUpdateChecking();

      // Check for immediate updates
      if (this.registration.waiting) {
        this.handleUpdateAvailable();
      }

      // Listen for new service worker installations
      this.registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker: Update found');
        const newWorker = this.registration?.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              this.handleUpdateAvailable();
            }
          });
        }
      });

      // Start periodic version checking (but not in development)
      if (!this.isDevelopment) {
        this.startVersionPolling();
      } else {
        console.log(
          '🚧 Service Worker: Skipping version polling in development mode'
        );
      }
    } catch (error) {
      console.error('❌ Service Worker: Registration failed:', error);

      // In development, provide helpful debugging info
      if (this.isDevelopment) {
        console.log('🔍 Debug info:');
        console.log('- Make sure the dev server is running');
        console.log(
          '- Check that /sw.js is accessible at http://localhost:5173/sw.js'
        );
        console.log('- Service worker should be served by Vite middleware');
      }
    }
  }

  /**
   * Set up service worker update detection
   */
  private setupUpdateChecking(): void {
    if (!this.registration) return;

    // Check for updates when page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isDevelopment) {
        this.checkForUpdates();
      }
    });

    // Check for updates when coming back online
    window.addEventListener('online', () => {
      if (!this.isDevelopment) {
        this.checkForUpdates();
      }
    });
  }

  /**
   * Handle when an update is available
   */
  private handleUpdateAvailable(): void {
    console.log('📱 Service Worker: Update available');

    // In development, just log it
    if (this.isDevelopment) {
      console.log(
        '🚧 Development mode: Service worker update detected but auto-update disabled'
      );
      return;
    }

    // You can customize this notification
    if (
      window.confirm('A new version is available! Would you like to update?')
    ) {
      this.skipWaiting();
    }
  }

  /**
   * Force update to new service worker
   */
  public skipWaiting(): void {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload the page after the new service worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }

  /**
   * Check for service worker updates
   */
  public async checkForUpdates(): Promise<void> {
    if (this.isDevelopment) {
      console.log(
        '🚧 Service Worker: Update check skipped in development mode'
      );
      return;
    }

    try {
      if (this.registration) {
        await this.registration.update();
        console.log('🔍 Service Worker: Update check completed');
      }
    } catch (error) {
      console.warn('⚠️ Service Worker: Update check failed:', error);
    }
  }

  /**
   * Get current version information
   */
  public async getCurrentVersion(): Promise<VersionInfo | null> {
    try {
      // Try the API endpoint first, fallback to page endpoint
      let response = await fetch('/api/version');
      if (!response.ok) {
        response = await fetch('/version?format=json');
      }

      if (response.ok) {
        this.currentVersion = await response.json();
        return this.currentVersion;
      }
    } catch (error) {
      console.warn('⚠️ Version check failed:', error);
    }
    return null;
  }

  /**
   * Check if a new version is available
   */
  public async checkVersion(): Promise<{
    hasUpdate: boolean;
    currentVersion?: VersionInfo;
    newVersion?: VersionInfo;
  }> {
    try {
      const newVersion = await this.getCurrentVersion();

      if (!newVersion) {
        return { hasUpdate: false };
      }

      // If we have a cached version, compare build hashes
      if (
        this.currentVersion &&
        this.currentVersion.buildHash !== newVersion.buildHash
      ) {
        console.log('🆕 New version detected:', {
          current: this.currentVersion.buildHash,
          new: newVersion.buildHash,
        });

        return {
          hasUpdate: true,
          currentVersion: this.currentVersion,
          newVersion,
        };
      }

      // Update our cached version
      this.currentVersion = newVersion;
      return { hasUpdate: false, currentVersion: newVersion };
    } catch (error) {
      console.warn('⚠️ Version comparison failed:', error);
      return { hasUpdate: false };
    }
  }

  /**
   * Start periodic version polling
   */
  private startVersionPolling(): void {
    // Check for version updates every 5 minutes
    setInterval(() => {
      this.checkVersion().then(({ hasUpdate, newVersion }) => {
        if (hasUpdate && newVersion) {
          console.log('🔔 New version available:', newVersion);
          // You could dispatch a custom event here for UI notifications
          window.dispatchEvent(
            new CustomEvent('versionUpdate', { detail: newVersion })
          );
        }
      });
    }, 5 * 60 * 1000); // 5 minutes

    // Also check when the app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkVersion();
      }
    });
  }

  /**
   * Get cache information for debugging
   */
  public async getCacheInfo(): Promise<{
    caches: string[];
    totalSize?: number;
  }> {
    try {
      const cacheNames = await caches.keys();
      console.log('📦 Available caches:', cacheNames);

      return { caches: cacheNames };
    } catch (error) {
      console.warn('⚠️ Cache info retrieval failed:', error);
      return { caches: [] };
    }
  }

  /**
   * Clear all caches (for debugging)
   */
  public async clearAllCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      console.log('🗑️ All caches cleared');
    } catch (error) {
      console.error('❌ Cache clearing failed:', error);
    }
  }

  /**
   * Check if the app is running offline
   */
  public isOffline(): boolean {
    return !navigator.onLine;
  }

  /**
   * Get service worker status
   */
  public getStatus(): {
    isSupported: boolean;
    isRegistered: boolean;
    isControlling: boolean;
    updateAvailable: boolean;
    isDevelopment: boolean;
  } {
    return {
      isSupported: 'serviceWorker' in navigator,
      isRegistered: !!this.registration,
      isControlling: !!navigator.serviceWorker.controller,
      updateAvailable: !!this.registration?.waiting,
      isDevelopment: this.isDevelopment,
    };
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Export utility functions
export const registerServiceWorker = () => serviceWorkerManager.init();
export const checkForUpdates = () => serviceWorkerManager.checkForUpdates();
export const getCurrentVersion = () => serviceWorkerManager.getCurrentVersion();
export const getServiceWorkerStatus = () => serviceWorkerManager.getStatus();
