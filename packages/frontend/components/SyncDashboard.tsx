import { useState } from 'react';
import {
  ConflictList,
  ConflictResolutionModal,
  SyncStatusIndicator,
} from '@packing-list/shared-components';
import type { SyncConflict } from '@packing-list/model';
import { resolveConflict, useAppDispatch } from '@packing-list/state';
import {
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useAppSelector } from '@packing-list/state';

// Mock conflict data for testing
const mockConflicts: SyncConflict[] = [
  {
    id: 'conflict-1',
    entityType: 'trip',
    entityId: 'trip-123',
    localVersion: {
      title: 'My Amazing Trip (Local)',
      description: 'Updated locally with new activities',
      startDate: '2024-12-15',
      endDate: '2024-12-22',
      updatedAt: Date.now() - 300000, // 5 minutes ago
      createdAt: Date.now() - 86400000 * 7, // 7 days ago
      timestamp: Date.now() - 300000,
    },
    serverVersion: {
      title: 'My Amazing Trip (Server)',
      description: 'Updated on server with budget changes',
      startDate: '2024-12-15',
      endDate: '2024-12-22',
      updatedAt: Date.now() - 60000, // 1 minute ago
      createdAt: Date.now() - 86400000 * 7, // 7 days ago
      timestamp: Date.now() - 60000,
    },
    conflictType: 'update_conflict',
    timestamp: Date.now(),
  },
  {
    id: 'conflict-2',
    entityType: 'item',
    entityId: 'item-456',
    localVersion: {
      name: 'Hiking Boots',
      category: 'Footwear',
      packed: false,
      quantity: 1,
      weight: 800,
      lastModified: Date.now() - 3600000, // 1 hour ago
      updatedAt: Date.now() - 3600000,
    },
    serverVersion: {
      name: 'Hiking Boots',
      category: 'Footwear',
      packed: true,
      quantity: 1,
      weight: 850,
      lastModified: Date.now() - 1800000, // 30 minutes ago
      updatedAt: Date.now() - 1800000,
    },
    conflictType: 'update_conflict',
    timestamp: Date.now(),
  },
  {
    id: 'conflict-3',
    entityType: 'rule_pack',
    entityId: 'pack-789',
    localVersion: {
      name: 'Winter Essentials Pack',
      description: 'Essential items for cold weather trips',
      version: '1.2.0',
      author: 'Local User',
      createdAt: 1703116800000, // December 21, 2023
      updated_at: Date.now() - 86400000 * 2, // 2 days ago
      publishedAt: 1703116800000,
    },
    serverVersion: {
      name: 'Winter Essentials Pack v2',
      description:
        'Enhanced essential items for cold weather trips with new gear',
      version: '2.0.0',
      author: 'Community',
      createdAt: 1703116800000, // December 21, 2023
      updated_at: Date.now() - 86400000, // 1 day ago
      publishedAt: Date.now() - 86400000,
    },
    conflictType: 'update_conflict',
    timestamp: Date.now(),
  },
];

export function SyncDashboard() {
  const { syncState, isInitialized } = useAppSelector((state) => state.sync);
  const dispatch = useAppDispatch();
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(
    null
  );

  const handleResolveConflict = (conflict: SyncConflict) => {
    setSelectedConflict(conflict);
  };

  const handleConflictResolution = async (
    strategy: 'local' | 'server' | 'manual',
    data?: unknown
  ) => {
    console.log(
      '🔧 [SYNC DASHBOARD] Resolving conflict:',
      selectedConflict?.id,
      'with strategy:',
      strategy
    );
    if (data) {
      console.log('🔧 [SYNC DASHBOARD] Manual data:', data);
    }

    // Use the proper conflict resolution action that updates both Redux and IndexedDB
    if (selectedConflict) {
      await dispatch(
        resolveConflict({
          conflictId: selectedConflict.id,
          strategy,
          manualData: data,
          conflict: selectedConflict,
        })
      );
    }

    setSelectedConflict(null);
  };

  const handleResolveAll = async (strategy: 'local' | 'server') => {
    console.log(
      '🔧 [SYNC DASHBOARD] Resolving all conflicts with strategy:',
      strategy
    );
    dispatch({ type: 'CLEAR_SYNC_CONFLICTS' });
  };

  const toggleSyncing = () => {
    console.log(
      '🔧 [SYNC DASHBOARD] Toggling sync status:',
      !syncState.isSyncing
    );
    dispatch({
      type: 'SET_SYNC_SYNCING_STATUS',
      payload: !syncState.isSyncing,
    });
  };

  const toggleOnline = () => {
    console.log(
      '🔧 [SYNC DASHBOARD] Toggling online status:',
      !syncState.isOnline
    );
    dispatch({
      type: 'SET_SYNC_ONLINE_STATUS',
      payload: !syncState.isOnline,
    });
  };

  const addMockConflict = () => {
    const newConflict: SyncConflict = {
      id: `conflict-${Date.now()}`,
      entityType: 'person',
      entityId: `person-${Date.now()}`,
      localVersion: {
        name: 'John Doe (Local)',
        age: 25,
        timestamp: Date.now() - 500,
      },
      serverVersion: {
        name: 'John Doe (Server)',
        age: 26,
        timestamp: Date.now(),
      },
      conflictType: 'update_conflict',
      timestamp: Date.now(),
    };

    console.log('🔧 [SYNC DASHBOARD] Adding mock conflict:', newConflict.id);
    dispatch({ type: 'ADD_SYNC_CONFLICT', payload: newConflict });
  };

  const displayState = syncState;

  return (
    <div className="space-y-6">
      {/* Sync Status Overview */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Sync Status
            </h2>
            <div className="flex items-center gap-2">
              {isInitialized && (
                <div className="badge badge-success">Initialized</div>
              )}
              <div className="badge badge-info">Redux State</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2">Live Status</h3>
              <SyncStatusIndicator
                syncState={displayState}
                onClick={() =>
                  console.log('🔧 [SYNC DASHBOARD] Status indicator clicked')
                }
              />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Current State</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Online:</span>
                  <div className="flex items-center gap-1">
                    {displayState.isOnline ? (
                      <Wifi className="w-4 h-4 text-success" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-error" />
                    )}
                    <span>{displayState.isOnline ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Syncing:</span>
                  <div className="flex items-center gap-1">
                    {displayState.isSyncing ? (
                      <RefreshCw className="w-4 h-4 text-info animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-success" />
                    )}
                    <span>{displayState.isSyncing ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Pending Changes:</span>
                  <div className="flex items-center gap-1">
                    {displayState.pendingChanges.length > 0 && (
                      <Clock className="w-4 h-4 text-warning" />
                    )}
                    <span>{displayState.pendingChanges.length}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Conflicts:</span>
                  <div className="flex items-center gap-1">
                    {displayState.conflicts.length > 0 && (
                      <AlertTriangle className="w-4 h-4 text-error" />
                    )}
                    <span>{displayState.conflicts.length}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Last Sync:</span>
                  <span className="text-xs">
                    {displayState.lastSyncTimestamp
                      ? new Date(
                          displayState.lastSyncTimestamp
                        ).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Controls */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Sync Controls</h2>
          <div className="flex flex-wrap gap-2">
            {isInitialized && (
              <button
                onClick={() => {
                  console.log('NYI');
                }}
                className="btn btn-primary btn-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Force Sync
              </button>
            )}
            <button onClick={toggleSyncing} className="btn btn-sm">
              {syncState.isSyncing ? 'Stop Syncing' : 'Start Syncing'}
            </button>
            <button onClick={toggleOnline} className="btn btn-sm">
              Go {syncState.isOnline ? 'Offline' : 'Online'}
            </button>
          </div>
        </div>
      </div>

      {/* Demo/Testing Controls */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Testing & Demo Controls</h2>
          <p className="text-base-content/70 mb-4">
            These controls simulate sync scenarios for testing and demonstration
            purposes.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={addMockConflict}
              className="btn btn-sm btn-outline"
            >
              Add Single Conflict
            </button>
            <button
              className="btn btn-warning btn-sm"
              onClick={() =>
                dispatch({
                  type: 'SET_SYNC_CONFLICTS',
                  payload: mockConflicts,
                })
              }
              disabled={syncState.conflicts.length > 0}
            >
              Simulate Multiple Conflicts
            </button>
            <button
              className="btn btn-success btn-sm"
              onClick={() => dispatch({ type: 'CLEAR_SYNC_CONFLICTS' })}
              disabled={syncState.conflicts.length === 0}
            >
              Clear All Conflicts
            </button>
          </div>
        </div>
      </div>

      {/* Conflicts List */}
      {displayState.conflicts.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-error" />
              Active Sync Conflicts ({displayState.conflicts.length})
            </h2>
            <ConflictList
              conflicts={displayState.conflicts}
              onResolveConflict={handleResolveConflict}
              onResolveAll={handleResolveAll}
            />
          </div>
        </div>
      )}

      {/* Individual Conflict Resolution Modal */}
      {selectedConflict && (
        <ConflictResolutionModal
          isOpen={!!selectedConflict}
          onClose={() => setSelectedConflict(null)}
          conflict={selectedConflict}
          onResolve={handleConflictResolution}
          onCancel={() => setSelectedConflict(null)}
        />
      )}
    </div>
  );
}
