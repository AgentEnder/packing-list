import { useState, useEffect } from 'react';
import {
  serviceWorkerManager,
  getServiceWorkerStatus,
  getCurrentVersion,
  setServiceWorkerEnabled,
  getServiceWorkerEnabled,
  registerServiceWorker,
  unregisterServiceWorker,
  type VersionInfo,
} from '../utils/serviceWorker.js';
import { applyBaseUrl } from '@packing-list/shared-utils';
import { showToast } from './Toast.js';

interface ServiceWorkerStatusProps {
  minimal?: boolean;
}

export function ServiceWorkerStatus({
  minimal = false,
}: ServiceWorkerStatusProps) {
  const [status, setStatus] = useState(getServiceWorkerStatus());
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    // Get initial version
    getCurrentVersion().then(setVersion);

    // Listen for version updates
    const handleVersionUpdate = (event: CustomEvent) => {
      setVersion(event.detail);
    };

    window.addEventListener(
      'versionUpdate',
      handleVersionUpdate as EventListener
    );

    // Update status periodically
    const interval = setInterval(() => {
      setStatus(getServiceWorkerStatus());
    }, 5000);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        'versionUpdate',
        handleVersionUpdate as EventListener
      );
    };
  }, []);

  const handleToggleServiceWorker = async () => {
    setIsToggling(true);
    try {
      const currentlyEnabled = getServiceWorkerEnabled();
      const newState = !currentlyEnabled;

      setServiceWorkerEnabled(newState);

      if (newState) {
        // Enable: register the service worker
        await registerServiceWorker();
        showToast('Service worker enabled and registered');
      } else {
        // Disable: unregister the service worker
        await unregisterServiceWorker();
        showToast('Service worker disabled and unregistered');
      }

      // Update status
      setStatus(getServiceWorkerStatus());
    } catch (error) {
      console.error('Failed to toggle service worker:', error);
      showToast('Failed to toggle service worker');
    } finally {
      setIsToggling(false);
    }
  };

  const handleClearCache = async () => {
    if (confirm('Clear all caches? This will force a full reload.')) {
      await serviceWorkerManager.clearAllCaches();
      window.location.reload();
    }
  };

  const handleCheckUpdates = async () => {
    await serviceWorkerManager.checkForUpdates();
    setStatus(getServiceWorkerStatus());
  };

  const handleForceUpdate = () => {
    serviceWorkerManager.skipWaiting();
  };

  const handleTestServiceWorker = async () => {
    try {
      const response = await fetch(
        applyBaseUrl(import.meta.env.PUBLIC_ENV__BASE_URL, '/service-worker.js')
      );
      if (response.ok) {
        alert('✅ Service worker is accessible! Check console for details.');
        console.log('🔧 Service worker test successful:', {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url,
        });
      } else {
        alert(`❌ Service worker not accessible: ${response.status}`);
      }
    } catch (error) {
      alert(`❌ Service worker test failed: ${error}`);
      console.error('Service worker test error:', error);
    }
  };

  // Minimal view for production
  if (minimal) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="tooltip tooltip-left" data-tip="Service Worker Status">
          <button
            className={`btn btn-circle btn-sm ${
              status.isControlling
                ? 'btn-success'
                : status.isDevelopment
                ? 'btn-info'
                : 'btn-warning'
            }`}
            onClick={() => setIsVisible(!isVisible)}
          >
            {status.isControlling ? '🟢' : status.isDevelopment ? '🔧' : '🟡'}
          </button>
        </div>

        {isVisible && (
          <div className="absolute bottom-12 right-0 bg-base-100 border rounded-lg p-4 shadow-lg min-w-64">
            <div className="text-sm space-y-2">
              <div className="font-semibold">Service Worker Status</div>

              {/* Service Worker Toggle */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-2 py-1">
                  <input
                    type="checkbox"
                    className="toggle toggle-xs toggle-primary"
                    checked={status.isEnabled}
                    onChange={handleToggleServiceWorker}
                    disabled={isToggling}
                  />
                  <span className="label-text text-xs">
                    {status.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              <div>
                Mode: {status.isDevelopment ? 'Development' : 'Production'}
              </div>
              <div>Online: {navigator.onLine ? '✅' : '❌'}</div>
              <div>Controlling: {status.isControlling ? '✅' : '❌'}</div>
              {status.updateAvailable && !status.isDevelopment && (
                <button
                  className="btn btn-sm btn-primary w-full"
                  onClick={handleForceUpdate}
                >
                  Update Available - Click to Update
                </button>
              )}
              {status.isDevelopment && (
                <button
                  className="btn btn-sm btn-outline w-full"
                  onClick={handleTestServiceWorker}
                >
                  Test Service Worker
                </button>
              )}
              {version && (
                <div className="text-xs opacity-70">
                  v{version.version} ({version.buildHash})
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full debug view
  return (
    <div className="bg-base-200 p-4 rounded-lg">
      <h3 className="font-semibold mb-3">🔧 Service Worker Debug</h3>

      {/* Service Worker Enable/Disable Toggle */}
      <div className="mb-4 p-3 bg-base-100 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Service Worker</h4>
            <p className="text-sm opacity-70">
              {status.isDevelopment
                ? 'Disabled by default in development mode'
                : 'Enable offline support and caching'}
            </p>
          </div>
          <div className="form-control">
            <label className="label cursor-pointer gap-2">
              <span className="label-text">
                {status.isEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={status.isEnabled}
                onChange={handleToggleServiceWorker}
                disabled={isToggling}
              />
            </label>
          </div>
        </div>
        {!status.isEnabled && (
          <div className="mt-2 text-xs opacity-60">
            Enable to use offline features and faster loading
          </div>
        )}
      </div>

      {status.isDevelopment && (
        <div className="alert alert-info mb-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">🚧 Development Mode:</span>
            Service worker served by Vite middleware. Version polling disabled.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status */}
        <div className="bg-base-100 p-3 rounded">
          <h4 className="font-medium mb-2">Status</h4>
          <div className="space-y-1 text-sm">
            <div>
              Mode: {status.isDevelopment ? '🚧 Development' : '🚀 Production'}
            </div>
            <div>Supported: {status.isSupported ? '✅' : '❌'}</div>
            <div>Enabled: {status.isEnabled ? '✅' : '❌'}</div>
            <div>Registered: {status.isRegistered ? '✅' : '❌'}</div>
            <div>Controlling: {status.isControlling ? '✅' : '❌'}</div>
            <div>Update Available: {status.updateAvailable ? '✅' : '❌'}</div>
            <div>Online: {navigator.onLine ? '✅' : '❌'}</div>
          </div>
        </div>

        {/* Version Info */}
        <div className="bg-base-100 p-3 rounded">
          <h4 className="font-medium mb-2">Version</h4>
          {version ? (
            <div className="space-y-1 text-sm">
              <div>
                <strong>Version:</strong> {version.version}
              </div>
              <div>
                <strong>Build:</strong> {version.buildHash}
              </div>
              <div>
                <strong>Time:</strong>{' '}
                {new Date(version.buildTime).toLocaleDateString()}
              </div>
              <div>
                <strong>Env:</strong> {version.environment}
              </div>
            </div>
          ) : (
            <div className="text-sm opacity-70">Version info not available</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {status.isDevelopment ? (
          <button
            className="btn btn-sm btn-outline"
            onClick={handleTestServiceWorker}
          >
            Test Service Worker Access
          </button>
        ) : (
          <button
            className="btn btn-sm btn-outline"
            onClick={handleCheckUpdates}
          >
            Check for Updates
          </button>
        )}

        {status.updateAvailable && !status.isDevelopment && (
          <button
            className="btn btn-sm btn-primary"
            onClick={handleForceUpdate}
          >
            Install Update
          </button>
        )}

        <button
          className="btn btn-sm btn-outline btn-warning"
          onClick={handleClearCache}
        >
          Clear Cache
        </button>

        <a
          href={applyBaseUrl(import.meta.env.PUBLIC_ENV__BASE_URL, '/version')}
          className="btn btn-sm btn-outline"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Version Page
        </a>

        {status.isDevelopment && (
          <a
            href="/service-worker.js"
            className="btn btn-sm btn-outline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Service Worker
          </a>
        )}
      </div>
    </div>
  );
}
