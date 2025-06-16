import React, { useState } from 'react';
import { useAppDispatch } from '@packing-list/state';
import { Database, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { ConfirmDialog } from '@packing-list/shared-components';
import { showToast } from './Toast';
import { resetSyncService } from '@packing-list/sync';

interface DatabaseResetUtilityProps {
  className?: string;
}

export const DatabaseResetUtility: React.FC<DatabaseResetUtilityProps> = ({
  className = '',
}) => {
  const dispatch = useAppDispatch();
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const clearIndexedDB = async (): Promise<void> => {
    console.log('🧹 [DATABASE RESET] Starting IndexedDB cleanup...');

    // Clear the main packing-list database
    const dbName = 'packing-list';

    try {
      // Delete the database
      await new Promise<void>((resolve, _reject) => {
        const deleteReq = indexedDB.deleteDatabase(dbName);
        deleteReq.onsuccess = () => {
          console.log(`🗑️ [DATABASE RESET] Deleted database: ${dbName}`);
          resolve();
        };
        deleteReq.onerror = () => {
          console.error(
            `❌ [DATABASE RESET] Failed to delete database: ${dbName}`
          );
          resolve(); // Continue even if deletion fails
        };
        deleteReq.onblocked = () => {
          console.warn(
            `⚠️ [DATABASE RESET] Database deletion blocked: ${dbName}`
          );
          resolve(); // Continue even if blocked
        };
      });
    } catch (error) {
      console.error(
        '❌ [DATABASE RESET] Error during IndexedDB cleanup:',
        error
      );
    }
  };

  const handleReset = async (): Promise<void> => {
    setIsResetting(true);

    try {
      console.log('🔄 [DATABASE RESET] Starting complete database reset...');

      // Step 1: Clear IndexedDB
      await clearIndexedDB();

      // Step 2: Clear Redux state (except auth)
      console.log('🧹 [DATABASE RESET] Clearing Redux state...');
      dispatch({ type: 'CLEAR_ALL_DATA' });

      // Step 3: Reset sync service to reinitialize
      console.log('🔄 [DATABASE RESET] Resetting sync service...');
      resetSyncService();

      // Step 4: Force page reload to ensure clean state
      console.log('🔄 [DATABASE RESET] Reloading page for clean state...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      console.log('✅ [DATABASE RESET] Database reset completed successfully');
      showToast('Database reset completed. Sync will reload data from server.');
    } catch (error) {
      console.error('❌ [DATABASE RESET] Database reset failed:', error);
      showToast('Database reset failed. Check console for details.');
    } finally {
      setIsResetting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <div className={`card bg-base-100 shadow-xl ${className}`}>
        <div className="card-body">
          <h2 className="card-title flex items-center gap-2 text-error">
            <Database className="w-5 h-5" />
            Database Reset Utility
          </h2>

          <div className="alert alert-warning">
            <AlertTriangle className="w-4 h-4" />
            <div>
              <h3 className="font-bold">Danger Zone</h3>
              <div className="text-xs">
                This will clear all local data and force sync to reload from
                server. Use this for debugging sync issues or starting fresh.
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p>
              <strong>This action will:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Clear all IndexedDB databases</li>
              <li>Reset Redux state (except authentication)</li>
              <li>Reinitialize sync service</li>
              <li>Reload the page for clean state</li>
              <li>Force sync to pull all data from server</li>
            </ul>
          </div>

          <div className="card-actions justify-end">
            <button
              className="btn btn-error"
              onClick={() => setShowConfirmation(true)}
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Reset Database
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Reset Database?"
        message="Are you sure you want to reset the database? This will clear all local data and reload from the server. This action cannot be undone."
        confirmText="Reset Database"
        cancelText="Cancel"
        confirmVariant="error"
        onConfirm={handleReset}
        data-testid="database-reset-confirm-dialog"
      />
    </>
  );
};
