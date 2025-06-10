import React from 'react';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import type { SyncConflict } from '@packing-list/model';

export interface ConflictListProps {
  conflicts: SyncConflict[];
  onResolveConflict: (conflict: SyncConflict) => void;
  onResolveAll?: (strategy: 'local' | 'server') => void;
}

interface ConflictData {
  [key: string]: unknown;
}

export const ConflictList: React.FC<ConflictListProps> = ({
  conflicts,
  onResolveConflict,
  onResolveAll,
}) => {
  const formatEntityType = (entityType: string): string => {
    switch (entityType) {
      case 'trip':
        return 'Trip';
      case 'person':
        return 'Person';
      case 'item':
        return 'Item';
      case 'rule_override':
        return 'Rule Override';
      case 'default_item_rule':
        return 'Default Rule';
      case 'rule_pack':
        return 'Rule Pack';
      default:
        return entityType;
    }
  };

  const getDataPreview = (data: ConflictData): string => {
    if (data.name) return data.name as string;
    if (data.title) return data.title as string;
    if (data.description) return data.description as string;
    return 'Unnamed item';
  };

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (conflicts.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-lg font-medium">No sync conflicts</p>
        <p className="text-sm">All your data is in sync!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with bulk actions */}
      {onResolveAll && conflicts.length > 1 && (
        <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              {conflicts.length} conflicts need resolution
            </span>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => onResolveAll('server')}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Use Server (All)
            </button>
            <button
              onClick={() => onResolveAll('local')}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Keep Local (All)
            </button>
          </div>
        </div>
      )}

      {/* Conflict list */}
      <div className="space-y-2">
        {conflicts.map((conflict) => {
          const localData = conflict.localVersion as ConflictData;
          const serverData = conflict.serverVersion as ConflictData;

          return (
            <div
              key={conflict.id}
              className="p-4 border border-yellow-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onResolveConflict(conflict)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {formatEntityType(conflict.entityType)} Conflict
                      </h4>
                      <p className="text-sm text-gray-600">
                        {getDataPreview(localData)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center space-x-6 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Local:{' '}
                        {formatTimestamp(
                          (localData.timestamp as number) || Date.now()
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Server:{' '}
                        {formatTimestamp(
                          (serverData.timestamp as number) || Date.now()
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
