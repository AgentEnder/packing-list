import React, { useState } from 'react';
import {
  SyncStatusBadge,
  ConflictResolutionModal,
  ConflictList,
} from '@packing-list/shared-components';
import { useSync } from './SyncProvider.js';
import type { SyncConflict } from '@packing-list/model';

export const SyncStatus: React.FC = () => {
  const { syncState, forceSync, conflictResolution } = useSync();
  const [showConflicts, setShowConflicts] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(
    null
  );

  const handleStatusClick = () => {
    if (syncState.conflicts.length > 0) {
      setShowConflicts(true);
    } else if (syncState.pendingChanges.length > 0) {
      forceSync();
    }
  };

  const handleResolveConflict = (conflict: SyncConflict) => {
    setSelectedConflict(conflict);
  };

  const handleConflictResolution = async (
    strategy: 'local' | 'server' | 'manual',
    data?: unknown
  ) => {
    if (selectedConflict) {
      await conflictResolution.resolveConflict(
        selectedConflict.id,
        strategy,
        data
      );
      setSelectedConflict(null);
    }
  };

  const handleResolveAll = async (strategy: 'local' | 'server') => {
    await conflictResolution.resolveAllConflicts(strategy);
    setShowConflicts(false);
  };

  return (
    <>
      <SyncStatusBadge
        syncState={syncState}
        onClick={handleStatusClick}
        showText={false}
      />

      {/* Conflicts List Modal */}
      {showConflicts && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Sync Conflicts</h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setShowConflicts(false)}
              >
                ✕
              </button>
            </div>

            <ConflictList
              conflicts={syncState.conflicts}
              onResolveConflict={handleResolveConflict}
              onResolveAll={handleResolveAll}
            />
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setShowConflicts(false)}
          />
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
    </>
  );
};
