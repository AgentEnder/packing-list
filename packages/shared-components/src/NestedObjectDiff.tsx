import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Minus, Edit3 } from 'lucide-react';
import { deepEqual } from '@packing-list/shared-utils';

interface NestedObjectDiffProps {
  localValue: unknown;
  serverValue: unknown;
  path?: string;
  showPath?: boolean;
  expanded?: boolean;
}

export const NestedObjectDiff: React.FC<NestedObjectDiffProps> = ({
  localValue,
  serverValue,
  path = '',
  showPath = false,
  expanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const formatValue = (value: unknown): string => {
    if (value === undefined) return '(undefined)';
    if (value === null) return 'null';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }
    if (typeof value === 'object') {
      const keys = Object.keys(value as Record<string, unknown>);
      return `{${keys.length} properties}`;
    }
    return String(value);
  };

  const canExpand = (value: unknown): boolean => {
    return (
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      Object.keys(value as Record<string, unknown>).length > 0
    );
  };

  const renderNestedDiff = (
    localObj: Record<string, unknown>,
    serverObj: Record<string, unknown>,
    basePath: string
  ) => {
    const allKeys = new Set([
      ...Object.keys(localObj),
      ...Object.keys(serverObj),
    ]);

    return Array.from(allKeys).reduce((fragments, key) => {
      const currentPath = basePath ? `${basePath}.${key}` : key;
      const localVal = localObj[key];
      const serverVal = serverObj[key];

      let diffType: 'same' | 'added' | 'removed' | 'changed' = 'same';
      if (!(key in localObj)) {
        diffType = 'added';
      } else if (!(key in serverObj)) {
        diffType = 'removed';
      } else if (!deepEqual(localVal, serverVal)) {
        diffType = 'changed';
      }

      if (diffType === 'same') return fragments;

      fragments.push(
        <div key={key} className="ml-4 border-l border-gray-200 pl-3 py-1">
          <div className="flex items-center gap-2 text-sm">
            {diffType === 'added' && (
              <Plus className="h-3 w-3 text-green-600" />
            )}
            {diffType === 'removed' && (
              <Minus className="h-3 w-3 text-red-600" />
            )}
            {diffType === 'changed' && (
              <Edit3 className="h-3 w-3 text-yellow-600" />
            )}
            <span className="font-mono text-xs">{key}:</span>
          </div>

          <div className="ml-5 grid grid-cols-2 gap-2 text-xs">
            <div
              className={`p-1 rounded ${
                diffType === 'removed'
                  ? 'bg-red-50 text-red-700'
                  : diffType === 'changed'
                  ? 'bg-yellow-50 text-yellow-700'
                  : 'bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-600 mb-1">Local</div>
              <div className="font-mono">
                {diffType === 'added' ? '(not present)' : formatValue(localVal)}
              </div>
            </div>
            <div
              className={`p-1 rounded ${
                diffType === 'added'
                  ? 'bg-green-50 text-green-700'
                  : diffType === 'changed'
                  ? 'bg-yellow-50 text-yellow-800'
                  : 'bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-600 mb-1">Server</div>
              <div className="font-mono">
                {diffType === 'removed'
                  ? '(not present)'
                  : formatValue(serverVal)}
              </div>
            </div>
          </div>

          {/* Recursively render nested objects */}
          {diffType === 'changed' &&
          localVal &&
          serverVal &&
          typeof localVal === 'object' &&
          typeof serverVal === 'object' &&
          !Array.isArray(localVal) &&
          !Array.isArray(serverVal) ? (
            <div className="mt-2">
              {renderNestedDiff(
                localVal as Record<string, unknown>,
                serverVal as Record<string, unknown>,
                currentPath
              )}
            </div>
          ) : null}
        </div>
      );
      return fragments;
    }, [] as React.JSX.Element[]);
  };

  // If both values are primitives or null/undefined, show simple comparison
  if (!canExpand(localValue) && !canExpand(serverValue)) {
    const isEqual = deepEqual(localValue, serverValue);
    if (isEqual) {
      return <div className="text-sm text-gray-600">Values are identical</div>;
    }

    return (
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
          <div className="font-medium text-gray-600 mb-1">Local</div>
          <div className="font-mono text-yellow-700">
            {formatValue(localValue)}
          </div>
        </div>
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
          <div className="font-medium text-gray-600 mb-1">Server</div>
          <div className="font-mono text-yellow-800">
            {formatValue(serverValue)}
          </div>
        </div>
      </div>
    );
  }

  // Handle object comparison
  const localObj = (canExpand(localValue) ? localValue : {}) as Record<
    string,
    unknown
  >;
  const serverObj = (canExpand(serverValue) ? serverValue : {}) as Record<
    string,
    unknown
  >;

  const hasNestedChanges = !deepEqual(localObj, serverObj);

  if (!hasNestedChanges) {
    return <div className="text-sm text-gray-600">Objects are identical</div>;
  }

  return (
    <div className="space-y-2">
      {showPath && path && (
        <div className="text-xs text-gray-500 font-mono">Path: {path}</div>
      )}

      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">Object Differences</span>
          </div>
          <div className="text-xs text-gray-500">
            {isExpanded ? 'Collapse' : 'Expand'} details
          </div>
        </button>

        {isExpanded && (
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            {renderNestedDiff(localObj, serverObj, path)}
          </div>
        )}
      </div>
    </div>
  );
};
