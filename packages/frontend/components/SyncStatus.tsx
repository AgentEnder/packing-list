import React, { useState } from 'react';
import {
  SyncStatusIndicator,
  ConflictList,
  ConflictResolutionModal,
} from '@packing-list/shared-components';
import { useAppSelector } from '@packing-list/state';
import type { SyncConflict } from '@packing-list/model';
import { useAppDispatch } from '@packing-list/state';

export const SyncStatus: React.FC = () => {
  const syncState = useAppSelector((state) => state.sync);
  const dispatch = useAppDispatch();
  const [showConflicts, setShowConflicts] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(
    null
  );

  const handleStatusClick = () => {
    if (syncState.syncState.conflicts.length > 0) {
      setShowConflicts(true);
    }
  };

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
    setShowConflicts(false);
  };

  const handleCloseModal = () => {
    setSelectedConflict(null);
  };

  const handleCloseConflicts = () => {
    setShowConflicts(false);
  };

  return (
    <>
      <SyncStatusIndicator
        syncState={syncState.syncState}
        onClick={handleStatusClick}
      />

      {/* Conflicts List Modal */}
      {showConflicts && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Sync Conflicts</h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={handleCloseConflicts}
              >
                ✕
              </button>
            </div>

            <ConflictList
              conflicts={syncState.syncState.conflicts}
              onResolveConflict={handleResolveConflict}
              onResolveAll={handleResolveAll}
            />
          </div>
          <div className="modal-backdrop" onClick={handleCloseConflicts} />
        </div>
      )}

      {/* Individual Conflict Resolution Modal */}
      {selectedConflict && (
        <ConflictResolutionModal
          isOpen={true}
          onClose={handleCloseModal}
          conflict={selectedConflict}
          onResolve={handleConflictResolution}
          onCancel={handleCloseModal}
        />
      )}
    </>
  );
};
