import React from 'react';
import { useData } from 'vike-react/useData';

// This page returns version information
export default function VersionPage() {
  const { versionInfo } = useData<{ versionInfo: any }>();

  // Check if this is a JSON request by looking at URL params
  const urlParams = new URLSearchParams(window.location.search);
  const isJsonRequest = urlParams.get('format') === 'json';

  // If JSON is requested, display as JSON
  if (isJsonRequest) {
    return (
      <pre style={{ margin: 0, fontFamily: 'monospace' }}>
        {JSON.stringify(versionInfo, null, 2)}
      </pre>
    );
  }

  // Otherwise show a nice HTML page
  return (
    <div
      style={{ fontFamily: 'monospace', padding: '20px', maxWidth: '600px' }}
    >
      <h1>🔧 Build Information</h1>
      <div
        style={{
          background: '#f5f5f5',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px',
        }}
      >
        <div style={{ marginBottom: '10px' }}>
          <strong>Version:</strong> {versionInfo.version}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Build Hash:</strong> <code>{versionInfo.buildHash}</code>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Build Time:</strong>{' '}
          {new Date(versionInfo.buildTime).toLocaleString()}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Environment:</strong> {versionInfo.environment}
        </div>
        <div>
          <strong>Current Time:</strong>{' '}
          {new Date(versionInfo.timestamp).toLocaleString()}
        </div>
      </div>

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <p>
          💡 <strong>API Usage:</strong>
        </p>
        <p>
          For JSON format: <code>/version?format=json</code>
        </p>
        <p>For service worker version checking</p>
      </div>

      <details style={{ marginTop: '20px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
          Raw JSON
        </summary>
        <pre
          style={{
            background: '#f8f8f8',
            padding: '15px',
            borderRadius: '4px',
            overflow: 'auto',
            marginTop: '10px',
          }}
        >
          {JSON.stringify(versionInfo, null, 2)}
        </pre>
      </details>
    </div>
  );
}
