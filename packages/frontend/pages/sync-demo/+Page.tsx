import React, { useState } from 'react';
import {
  ConflictList,
  ConflictResolutionModal,
  SyncStatusIndicator,
} from '@packing-list/shared-components';
import type { SyncConflict } from '@packing-list/model';
import { useSyncContext } from '../../components/SyncProvider.js';
import { useAppDispatch } from '@packing-list/state';

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

export default function SyncDemoPage() {
  const { syncState, forceSync, isInitialized } = useSyncContext();
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
      'Resolving conflict:',
      selectedConflict?.id,
      'with strategy:',
      strategy
    );
    if (data) {
      console.log('Manual data:', data);
    }

    // Remove the conflict from Redux state
    if (selectedConflict) {
      dispatch({ type: 'REMOVE_SYNC_CONFLICT', payload: selectedConflict.id });
    }

    setSelectedConflict(null);
  };

  const handleResolveAll = async (strategy: 'local' | 'server') => {
    console.log('Resolving all conflicts with strategy:', strategy);
    dispatch({ type: 'CLEAR_SYNC_CONFLICTS' });
  };

  const toggleSyncing = () => {
    dispatch({
      type: 'SET_SYNC_SYNCING_STATUS',
      payload: !syncState.isSyncing,
    });
  };

  const toggleOnline = () => {
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

    dispatch({ type: 'ADD_SYNC_CONFLICT', payload: newConflict });
  };

  const displayState = syncState;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sync System Demo</h1>
        <div className="flex items-center gap-4">
          <span className="badge badge-info">Using Redux State</span>
          {isInitialized && (
            <span className="badge badge-success">Sync Initialized</span>
          )}
        </div>
      </div>

      {/* Sync Status Indicators */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Sync Status Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Status Indicator</h3>
              <SyncStatusIndicator
                syncState={displayState}
                onClick={() => console.log('Status clicked')}
              />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Status Badge</h3>
              <div className="flex gap-2">
                <SyncStatusIndicator
                  syncState={displayState}
                  onClick={() => console.log('Badge clicked')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Controls */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Demo Controls</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={toggleSyncing} className="btn btn-sm">
              {syncState.isSyncing ? 'Stop Syncing' : 'Start Syncing'}
            </button>
            <button onClick={toggleOnline} className="btn btn-sm">
              Go {syncState.isOnline ? 'Offline' : 'Online'}
            </button>
            <button onClick={addMockConflict} className="btn btn-sm">
              Add Conflict
            </button>
            <button
              className="btn btn-warning"
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
              className="btn btn-success"
              onClick={() => dispatch({ type: 'CLEAR_SYNC_CONFLICTS' })}
              disabled={syncState.conflicts.length === 0}
            >
              Clear All Conflicts
            </button>
          </div>
        </div>
      </div>

      {/* Real Sync Actions */}
      {isInitialized && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Sync Actions</h2>
            <div className="flex gap-2">
              <button onClick={forceSync} className="btn btn-primary">
                Force Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync State Display */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Current Sync State</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Online:</strong> {displayState.isOnline ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Syncing:</strong> {displayState.isSyncing ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Pending Changes:</strong>{' '}
              {displayState.pendingChanges.length}
            </div>
            <div>
              <strong>Conflicts:</strong> {displayState.conflicts.length}
            </div>
            <div className="md:col-span-2">
              <strong>Last Sync:</strong>{' '}
              {displayState.lastSyncTimestamp
                ? new Date(displayState.lastSyncTimestamp).toLocaleString()
                : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* Conflicts List */}
      {displayState.conflicts.length > 0 && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Sync Conflicts</h2>
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
