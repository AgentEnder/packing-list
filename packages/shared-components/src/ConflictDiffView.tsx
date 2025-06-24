import React from 'react';
import { ChevronDown, ChevronRight, Plus, Minus, Edit3 } from 'lucide-react';
import type { SyncConflict } from '@packing-list/model';
import { deepEqual } from '@packing-list/shared-utils';
import { NestedObjectDiff } from './NestedObjectDiff.js';

interface DiffEntry {
  key: string;
  localValue: unknown;
  serverValue: unknown;
  type: 'changed' | 'added' | 'removed' | 'same';
  path?: string; // Full path for nested conflicts
  isNested?: boolean;
}

interface ConflictDiffViewProps {
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  expanded?: boolean;
  // Enhanced props for deep diff support
  conflict?: SyncConflict;
  showOnlyConflicts?: boolean;
}

export const ConflictDiffView: React.FC<ConflictDiffViewProps> = ({
  localData,
  serverData,
  expanded = true,
  conflict,
  showOnlyConflicts = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(expanded);

  // Use enhanced conflict details if available, otherwise fall back to simple diff
  const diffEntries: DiffEntry[] = React.useMemo(() => {
    if (conflict?.conflictDetails?.conflicts) {
      // Use the detailed conflict information for more precise diffs
      const conflictPaths = new Set(
        conflict.conflictDetails.conflicts.map((c) => c.path)
      );

      // Create diff entries from conflict details
      const entries: DiffEntry[] = conflict.conflictDetails.conflicts.map(
        (conflictItem) => {
          const pathParts = conflictItem.path.split('.');
          const key = pathParts[0];
          const isNested = pathParts.length > 1;

          if (key === 'conditions') {
            console.log('conditions', conflictItem);
          }

          return {
            key,
            localValue: conflictItem.localValue,
            serverValue: conflictItem.serverValue,
            type:
              conflictItem.type === 'modified'
                ? 'changed'
                : conflictItem.type === 'added'
                ? 'added'
                : 'removed',
            path: conflictItem.path,
            isNested,
          };
        }
      );

      // Add non-conflicting fields if not showing only conflicts
      if (!showOnlyConflicts) {
        const allKeys = new Set([
          ...Object.keys(localData),
          ...Object.keys(serverData),
        ]);

        for (const key of allKeys) {
          if (!conflictPaths.has(key)) {
            const localValue = localData[key];
            const serverValue = serverData[key];

            entries.push({
              key,
              localValue,
              serverValue,
              type: 'same',
            });
          }
        }
      }

      return entries;
    } else {
      // Fall back to simple diff
      const allKeys = new Set([
        ...Object.keys(localData),
        ...Object.keys(serverData),
      ]);

      return Array.from(allKeys).map((key) => {
        const localValue = localData[key];
        const serverValue = serverData[key];

        if (!(key in localData)) {
          return { key, localValue: undefined, serverValue, type: 'added' };
        }
        if (!(key in serverData)) {
          return { key, localValue, serverValue: undefined, type: 'removed' };
        }
        if (!deepEqual(localValue, serverValue)) {
          return { key, localValue, serverValue, type: 'changed' };
        }
        return { key, localValue, serverValue, type: 'same' };
      });
    }
  }, [localData, serverData, conflict, showOnlyConflicts]);

  const isTimestampField = (key: string): boolean => {
    const timestampFields = [
      'timestamp',
      'createdAt',
      'updatedAt',
      'lastModified',
      'created_at',
      'updated_at',
      'last_modified',
    ];
    return timestampFields.some((field) =>
      key.toLowerCase().includes(field.toLowerCase())
    );
  };

  const isTimestampValue = (value: unknown): boolean => {
    if (typeof value === 'number') {
      // Check if it's a reasonable timestamp (after year 2000, before year 2100)
      return value > 946684800000 && value < 4102444800000;
    }
    if (typeof value === 'string') {
      // Try to parse as date
      const date = new Date(value);
      return !isNaN(date.getTime()) && date.getFullYear() > 2000;
    }
    return false;
  };

  const formatTimestamp = (value: unknown): string => {
    let date: Date;

    if (typeof value === 'number') {
      date = new Date(value);
    } else if (typeof value === 'string') {
      date = new Date(value);
    } else {
      return String(value);
    }

    if (isNaN(date.getTime())) {
      return String(value);
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Show relative time for recent timestamps
    let relativeTime = '';
    if (diffMinutes < 1) {
      relativeTime = 'just now';
    } else if (diffMinutes < 60) {
      relativeTime = `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      relativeTime = `${diffHours}h ago`;
    } else if (diffDays < 7) {
      relativeTime = `${diffDays}d ago`;
    }

    // Format as readable date and time
    const formatted = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });

    const raw = typeof value === 'number' ? value.toString() : String(value);
    const display = relativeTime ? `${formatted} (${relativeTime})` : formatted;

    return `${display}\n\nRaw: ${raw}`;
  };

  const formatValue = (value: unknown, key?: string): string => {
    if (value === undefined) return '(not set)';
    if (value === null) return 'null';

    // Handle timestamps specially
    if (key && (isTimestampField(key) || isTimestampValue(value))) {
      return formatTimestamp(value);
    }

    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `[${value.length} items]`;
      }
      const keys = Object.keys(value as Record<string, unknown>);
      return `{${keys.length} properties}`;
    }
    return String(value);
  };

  const isComplexObject = (value: unknown): boolean => {
    return (
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value as Record<string, unknown>).length > 0
    );
  };

  const getIcon = (type: DiffEntry['type']) => {
    switch (type) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'removed':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'changed':
        return <Edit3 className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getFieldClass = (type: DiffEntry['type']) => {
    switch (type) {
      case 'added':
        return 'bg-green-50 border-green-200';
      case 'removed':
        return 'bg-red-50 border-red-200';
      case 'changed':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getValueClass = (type: DiffEntry['type'], isLocal: boolean) => {
    switch (type) {
      case 'added':
        return isLocal ? 'text-gray-400' : 'text-green-700 font-medium';
      case 'removed':
        return isLocal ? 'text-red-700 font-medium' : 'text-gray-400';
      case 'changed':
        return isLocal ? 'text-yellow-700' : 'text-yellow-800 font-medium';
      default:
        return 'text-gray-700';
    }
  };

  const changedFields = diffEntries.filter((entry) => entry.type !== 'same');
  const unchangedFields = diffEntries.filter((entry) => entry.type === 'same');

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {changedFields.length} field{changedFields.length !== 1 ? 's' : ''}{' '}
          changed
          {unchangedFields.length > 0 && (
            <span>, {unchangedFields.length} unchanged</span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span>{isExpanded ? 'Collapse' : 'Expand'} details</span>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {/* Changed fields first */}
          {changedFields.map((entry) => (
            <div
              key={entry.path || entry.key}
              className={`p-3 rounded-lg border ${getFieldClass(entry.type)}`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {getIcon(entry.type)}
                <span className="font-medium text-gray-900">
                  {entry.path || entry.key}
                </span>
                {entry.isNested && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Nested
                  </span>
                )}
                <span className="text-xs text-gray-500 uppercase">
                  {entry.type}
                </span>
              </div>

              {/* Show enhanced information for nested conflicts */}
              {entry.isNested && entry.path && (
                <div className="mb-2 text-sm text-gray-600">
                  <span className="font-medium">Path:</span> {entry.path}
                </div>
              )}

              {/* Show nested object diff for complex objects, otherwise show side-by-side comparison */}
              {entry.type === 'changed' &&
              isComplexObject(entry.localValue) &&
              isComplexObject(entry.serverValue) ? (
                <div className="mt-2">
                  <NestedObjectDiff
                    localValue={entry.localValue}
                    serverValue={entry.serverValue}
                    path={entry.path || entry.key}
                    showPath={!!entry.isNested}
                    expanded={false}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      Local Version
                    </div>
                    <div
                      className={`text-sm p-2 bg-white rounded border font-mono whitespace-pre-line ${getValueClass(
                        entry.type,
                        true
                      )}`}
                    >
                      {formatValue(entry.localValue, entry.key)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      Server Version
                    </div>
                    <div
                      className={`text-sm p-2 bg-white rounded border font-mono whitespace-pre-line ${getValueClass(
                        entry.type,
                        false
                      )}`}
                    >
                      {formatValue(entry.serverValue, entry.key)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Unchanged fields (collapsed by default) */}
          {unchangedFields.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                <span className="inline-flex items-center space-x-1">
                  <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                  <span>Show {unchangedFields.length} unchanged fields</span>
                </span>
              </summary>
              <div className="mt-2 space-y-2">
                {unchangedFields.map((entry) => (
                  <div
                    key={entry.key}
                    className="p-2 rounded border border-gray-200 bg-gray-50"
                  >
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      {entry.key}
                    </div>
                    <div className="text-sm text-gray-600 font-mono whitespace-pre-line">
                      {formatValue(entry.localValue, entry.key)}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
};
