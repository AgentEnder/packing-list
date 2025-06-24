import React, { useState, useMemo } from 'react';
import { Modal, type ModalProps } from './Dialog.js';
import {
  AlertTriangle,
  Database,
  Smartphone,
  Merge,
  ArrowLeft,
  Check,
  Eye,
} from 'lucide-react';
import type { SyncConflict } from '@packing-list/model';
import { ConflictDiffView } from './ConflictDiffView.js';
import { deepEqual } from '@packing-list/shared-utils';

export interface ConflictResolutionModalProps
  extends Omit<ModalProps, 'children'> {
  conflict: SyncConflict;
  onResolve: (strategy: 'local' | 'server' | 'manual', data?: unknown) => void;
  onCancel: () => void;
}

interface ConflictData {
  [key: string]: unknown;
}

type ResolutionStep = 'strategy' | 'merge' | 'preview';

interface FieldChoice {
  key: string;
  value: unknown;
  source: 'local' | 'server' | 'manual';
  isConflicted: boolean;
}

export const ConflictResolutionModal: React.FC<
  ConflictResolutionModalProps
> = ({ conflict, onResolve, onCancel, ...modalProps }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<
    'local' | 'server' | 'manual'
  >('server');
  const [currentStep, setCurrentStep] = useState<ResolutionStep>('strategy');
  const [fieldChoices, setFieldChoices] = useState<Map<string, FieldChoice>>(
    new Map()
  );

  const localData = conflict.localVersion as ConflictData;
  const serverData = conflict.serverVersion as ConflictData;

  // Helper function to get nested values from an object using dot notation
  const getNestedValue = (
    obj: Record<string, unknown>,
    path: string
  ): unknown => {
    return path.split('.').reduce((current: unknown, key) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as { [key: string]: unknown })[key];
      }
      return undefined;
    }, obj);
  };

  // Helper function to set nested values in an object using dot notation
  const setNestedValue = (
    obj: Record<string, unknown>,
    path: string,
    value: unknown
  ): void => {
    const keys = path.split('.');
    const lastKey = keys.pop();

    if (!lastKey) {
      return;
    }

    let current = obj;
    for (const key of keys) {
      if (
        !(key in current) ||
        typeof current[key] !== 'object' ||
        current[key] === null
      ) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[lastKey] = value;
  };

  const isTimestampField = (key: string): boolean => {
    const timestampFields = [
      'timestamp',
      'createdAt',
      'updatedAt',
      'lastModified',
      'created_at',
      'updated_at',
      'last_modified',
      'publishedAt',
      'published_at',
    ];
    return timestampFields.some((field) =>
      key.toLowerCase().includes(field.toLowerCase())
    );
  };

  const isSystemManagedField = (key: string): boolean => {
    const systemFields = [
      'timestamp',
      'updatedAt',
      'updated_at',
      'lastModified',
      'last_modified',
      'createdAt', // Keep createdAt as it shouldn't change after creation
      'created_at',
    ];
    return systemFields.some(
      (field) => key.toLowerCase() === field.toLowerCase()
    );
  };

  // Analyze field conflicts - use enhanced conflict details for granular selection
  const fieldAnalysis = useMemo(() => {
    // If we have enhanced conflict details, use them for granular field selection
    if (conflict.conflictDetails) {
      const fields: FieldChoice[] = [];

      // Add each specific conflict path as a selectable field
      conflict.conflictDetails.conflicts.forEach((conflictItem) => {
        const path = conflictItem.path;

        // Default to server value for conflicts
        const defaultSource: 'local' | 'server' = 'server';
        const defaultValue = conflictItem.serverValue;

        fields.push({
          key: path, // Use the full path as the key (e.g., "days.1.items.0.packed")
          value: defaultValue,
          source: defaultSource,
          isConflicted: true, // All items from conflict details are conflicted
        });
      });

      // Also add top-level fields that aren't conflicted for completeness
      const conflictedTopLevelKeys = new Set(
        conflict.conflictDetails.conflicts.map((c) => c.path.split('.')[0])
      );

      const allTopLevelKeys = new Set([
        ...Object.keys(localData),
        ...Object.keys(serverData),
      ]);

      allTopLevelKeys.forEach((key) => {
        if (!conflictedTopLevelKeys.has(key)) {
          const localValue = localData[key];
          const serverValue = serverData[key];
          const isConflicted = !deepEqual(localValue, serverValue);

          // Include both conflicted and non-conflicted top-level fields
          fields.push({
            key,
            value: isConflicted ? serverValue : localValue,
            source: isConflicted ? 'server' : 'local',
            isConflicted,
          });
        }
      });

      return fields;
    } else {
      // Fall back to simple top-level field analysis
      const allKeys = new Set([
        ...Object.keys(localData),
        ...Object.keys(serverData),
      ]);

      const fields: FieldChoice[] = Array.from(allKeys).map((key) => {
        const localValue = localData[key];
        const serverValue = serverData[key];
        const isConflicted = !deepEqual(localValue, serverValue);

        // Default to server value for conflicts, local for non-conflicts
        const defaultSource: 'local' | 'server' = isConflicted
          ? 'server'
          : 'local';
        const defaultValue =
          defaultSource === 'local' ? localValue : serverValue;

        return {
          key,
          value: defaultValue,
          source: defaultSource,
          isConflicted,
        };
      });

      return fields;
    }
  }, [localData, serverData, conflict]);

  // Get user-editable fields (exclude system-managed ones)
  const editableFields = useMemo(() => {
    return fieldAnalysis.filter((field) => !isSystemManagedField(field.key));
  }, [fieldAnalysis]);

  // Get system-managed fields for display purposes
  const systemFields = useMemo(() => {
    return fieldAnalysis.filter((field) => isSystemManagedField(field.key));
  }, [fieldAnalysis]);

  // Initialize field choices on first render
  React.useEffect(() => {
    if (fieldChoices.size === 0) {
      const initialChoices = new Map();
      fieldAnalysis.forEach((field) => {
        initialChoices.set(field.key, field);
      });
      setFieldChoices(initialChoices);
    }
  }, [fieldAnalysis, fieldChoices.size]);

  // Build the final merged object
  const mergedObject = useMemo(() => {
    // If we have enhanced conflict details, use smart merging
    if (conflict.conflictDetails) {
      const result = { ...conflict.conflictDetails.mergedObject };

      // Apply user field choices on top of the smart merge
      fieldChoices.forEach((choice) => {
        if (!isSystemManagedField(choice.key)) {
          if (choice.key.includes('.')) {
            // This is a nested path - use helper function to set nested value
            setNestedValue(result, choice.key, choice.value);
          } else {
            // Top-level field
            result[choice.key] = choice.value;
          }
        }
      });

      // Auto-set system-managed fields
      const now = Date.now();
      systemFields.forEach((field) => {
        if (
          field.key.toLowerCase() === 'timestamp' ||
          field.key.toLowerCase() === 'updatedat' ||
          field.key.toLowerCase() === 'updated_at' ||
          field.key.toLowerCase() === 'lastmodified' ||
          field.key.toLowerCase() === 'last_modified'
        ) {
          result[field.key] = now;
        } else if (
          field.key.toLowerCase() === 'createdat' ||
          field.key.toLowerCase() === 'created_at'
        ) {
          // Keep original creation time from local data, fallback to server data
          result[field.key] =
            localData[field.key] ?? serverData[field.key] ?? now;
        }
      });

      return result;
    } else {
      // Fall back to the original simple merging
      const result: ConflictData = {};

      // Add user-selected field values
      fieldChoices.forEach((choice) => {
        if (!isSystemManagedField(choice.key)) {
          result[choice.key] = choice.value;
        }
      });

      // Auto-set system-managed fields
      const now = Date.now();
      systemFields.forEach((field) => {
        if (
          field.key.toLowerCase() === 'timestamp' ||
          field.key.toLowerCase() === 'updatedat' ||
          field.key.toLowerCase() === 'updated_at' ||
          field.key.toLowerCase() === 'lastmodified' ||
          field.key.toLowerCase() === 'last_modified'
        ) {
          result[field.key] = now;
        } else if (
          field.key.toLowerCase() === 'createdat' ||
          field.key.toLowerCase() === 'created_at'
        ) {
          // Keep original creation time from local data, fallback to server data
          result[field.key] =
            localData[field.key] ?? serverData[field.key] ?? now;
        }
      });

      return result;
    }
  }, [fieldChoices, systemFields, localData, serverData, conflict]);

  // Count impacted fields (where choice differs from original local value)
  const impactedFields = useMemo(() => {
    const editableChanges = Array.from(fieldChoices.values()).filter(
      (choice) =>
        !isSystemManagedField(choice.key) &&
        (choice.source !== 'local' ||
          !deepEqual(choice.value, localData[choice.key]))
    );

    // System fields are always considered "impacted" since they'll be auto-updated
    const systemChanges = systemFields.filter(
      (field) =>
        field.key.toLowerCase() !== 'createdat' &&
        field.key.toLowerCase() !== 'created_at'
    );

    return [...editableChanges, ...systemChanges];
  }, [fieldChoices, localData, systemFields]);

  const formatTimestamp = (timestamp: unknown): string => {
    let date: Date;

    if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'Unknown';
    }

    if (isNaN(date.getTime())) {
      return 'Invalid Date';
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

    const formatted = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    return relativeTime ? `${formatted} (${relativeTime})` : formatted;
  };

  const formatFieldValue = (value: unknown, key: string): string => {
    if (value === undefined || value === null) return '(not set)';

    // Format timestamps specially
    if (
      isTimestampField(key) &&
      (typeof value === 'number' || typeof value === 'string')
    ) {
      const timestamp = formatTimestamp(value);
      const raw = String(value);
      return `${timestamp}\n\nRaw: ${raw}`;
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

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

  const handleFieldChoice = (key: string, source: 'local' | 'server') => {
    console.log(`Changing field ${key} to ${source}`);
    setFieldChoices((prev) => {
      const newChoices = new Map(prev);
      const currentChoice = newChoices.get(key);
      if (currentChoice) {
        // For nested paths, we need to get the value from the conflict details
        let newValue: unknown;

        if (conflict.conflictDetails && key.includes('.')) {
          // This is a nested path - find the corresponding conflict item
          const conflictItem = conflict.conflictDetails.conflicts.find(
            (c) => c.path === key
          );
          if (conflictItem) {
            newValue =
              source === 'local'
                ? conflictItem.localValue
                : conflictItem.serverValue;
          } else {
            // Fallback to extracting from the data objects
            newValue =
              source === 'local'
                ? getNestedValue(localData, key)
                : getNestedValue(serverData, key);
          }
        } else {
          // Top-level field
          newValue = source === 'local' ? localData[key] : serverData[key];
        }

        const updatedChoice = {
          ...currentChoice,
          value: newValue,
          source,
        };
        console.log(`Updated choice for ${key}:`, updatedChoice);
        newChoices.set(key, updatedChoice);
      }
      console.log('New field choices:', Array.from(newChoices.entries()));
      return newChoices;
    });
  };

  // Get current choice for a field (with fallback)
  const getCurrentChoice = (key: string): FieldChoice | undefined => {
    return fieldChoices.get(key);
  };

  const handleNext = () => {
    if (currentStep === 'strategy') {
      if (selectedStrategy === 'manual') {
        setCurrentStep('merge');
      } else {
        handleResolve();
      }
    } else if (currentStep === 'merge') {
      setCurrentStep('preview');
    }
  };

  const handleBack = () => {
    if (currentStep === 'preview') {
      setCurrentStep('merge');
    } else if (currentStep === 'merge') {
      setCurrentStep('strategy');
    }
  };

  const handleResolve = () => {
    switch (selectedStrategy) {
      case 'local':
        onResolve('local');
        break;
      case 'server':
        onResolve('server');
        break;
      case 'manual':
        onResolve('manual', mergedObject);
        break;
    }
  };

  const getModalTitle = () => {
    switch (currentStep) {
      case 'strategy':
        return 'Resolve Sync Conflict';
      case 'merge':
        return 'Choose Field Values';
      case 'preview':
        return 'Review Merged Object';
      default:
        return 'Resolve Sync Conflict';
    }
  };

  return (
    <Modal
      isOpen={modalProps.isOpen}
      onClose={onCancel}
      title={getModalTitle()}
      size="xl"
      modalBoxClassName="m-h-xl"
    >
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`flex items-center space-x-2 ${
              currentStep === 'strategy' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'strategy'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200'
              }`}
            >
              1
            </div>
            <span className="text-sm">Strategy</span>
          </div>
          <div className="w-8 h-px bg-gray-300" />
          <div
            className={`flex items-center space-x-2 ${
              currentStep === 'merge' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'merge'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200'
              }`}
            >
              2
            </div>
            <span className="text-sm">Merge</span>
          </div>
          <div className="w-8 h-px bg-gray-300" />
          <div
            className={`flex items-center space-x-2 ${
              currentStep === 'preview' ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200'
              }`}
            >
              3
            </div>
            <span className="text-sm">Preview</span>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'strategy' && (
          <>
            {/* Conflict Header */}
            <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">
                  Sync Conflict Detected
                </h3>
                <p className="text-sm text-yellow-700">
                  {formatEntityType(conflict.entityType)}:{' '}
                  {getDataPreview(localData)}
                </p>
              </div>
            </div>

            {/* Intelligent Diff View - Shown by default */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Changes Overview
                {conflict.conflictDetails && (
                  <span className="ml-2 text-sm text-blue-600">
                    ({conflict.conflictDetails.conflicts.length} field
                    {conflict.conflictDetails.conflicts.length !== 1
                      ? 's'
                      : ''}{' '}
                    conflicted)
                  </span>
                )}
              </h4>
              <ConflictDiffView
                localData={localData}
                serverData={serverData}
                expanded={true}
                conflict={conflict}
                showOnlyConflicts={false}
              />
            </div>

            {/* Resolution Options */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">
                Choose how to resolve this conflict:
              </h4>

              {/* Keep Local Changes */}
              <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="resolution"
                  value="local"
                  checked={selectedStrategy === 'local'}
                  onChange={(e) =>
                    setSelectedStrategy(e.target.value as 'local')
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Keep Local Changes</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Use your local version and overwrite the server.
                  </p>
                  <div className="text-xs text-gray-500 mt-2">
                    Last modified:{' '}
                    {formatTimestamp(
                      localData.timestamp || localData.updatedAt
                    )}
                  </div>
                </div>
              </label>

              {/* Use Server Version */}
              <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="resolution"
                  value="server"
                  checked={selectedStrategy === 'server'}
                  onChange={(e) =>
                    setSelectedStrategy(e.target.value as 'server')
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Use Server Version</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Accept the server version and discard local changes.
                  </p>
                  <div className="text-xs text-gray-500 mt-2">
                    Last modified:{' '}
                    {formatTimestamp(
                      serverData.timestamp || serverData.updatedAt
                    )}
                  </div>
                </div>
              </label>

              {/* Merge Versions */}
              <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="resolution"
                  value="manual"
                  checked={selectedStrategy === 'manual'}
                  onChange={(e) =>
                    setSelectedStrategy(e.target.value as 'manual')
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Merge className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Merge Field by Field</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose which value to keep for each conflicting field.
                  </p>
                  <div className="text-xs text-gray-500 mt-2">
                    Review and select field values manually
                  </div>
                </div>
              </label>
            </div>
          </>
        )}

        {/* Merge Step - Field by Field Selection */}
        {currentStep === 'merge' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Field Selection
              </h4>
              <p className="text-sm text-blue-700">
                Choose which value to keep for each field. Conflicting fields
                are highlighted.
              </p>
              {systemFields.length > 0 && (
                <p className="text-sm text-blue-600 mt-2">
                  <strong>Note:</strong> System-managed timestamp fields (
                  {systemFields.map((f) => f.key).join(', ')}) are excluded and
                  will be auto-updated.
                </p>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {editableFields.map((choice) => {
                // Get the actual values for this field (handling nested paths)
                let localValue: unknown;
                let serverValue: unknown;

                if (conflict.conflictDetails && choice.key.includes('.')) {
                  // For nested paths, get values from conflict details
                  const conflictItem = conflict.conflictDetails.conflicts.find(
                    (c) => c.path === choice.key
                  );
                  if (conflictItem) {
                    localValue = conflictItem.localValue;
                    serverValue = conflictItem.serverValue;
                  } else {
                    // Fallback to extracting from data objects
                    localValue = getNestedValue(localData, choice.key);
                    serverValue = getNestedValue(serverData, choice.key);
                  }
                } else {
                  // Top-level field
                  localValue = localData[choice.key];
                  serverValue = serverData[choice.key];
                }

                const isIdentical =
                  JSON.stringify(localValue) === JSON.stringify(serverValue);
                const currentChoice = getCurrentChoice(choice.key) || choice;

                return (
                  <div
                    key={choice.key}
                    className={`p-4 border rounded-lg ${
                      choice.isConflicted
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {choice.key}
                        </span>
                        {choice.isConflicted && (
                          <span className="px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded">
                            Conflicted
                          </span>
                        )}
                        {choice.key.includes('.') && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            Nested
                          </span>
                        )}
                      </div>
                    </div>

                    {!isIdentical ? (
                      <div className="grid grid-cols-2 gap-4">
                        {/* Local Option */}
                        <label
                          className={`flex items-start space-x-3 p-3 border rounded cursor-pointer transition-colors ${
                            currentChoice.source === 'local'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`field-${choice.key}`}
                            value="local"
                            checked={currentChoice.source === 'local'}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleFieldChoice(choice.key, 'local');
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <Smartphone className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Local</span>
                            </div>
                            <div className="text-sm text-gray-700 font-mono whitespace-pre-line break-all">
                              {formatFieldValue(localValue, choice.key)}
                            </div>
                          </div>
                        </label>

                        {/* Server Option */}
                        <label
                          className={`flex items-start space-x-3 p-3 border rounded cursor-pointer transition-colors ${
                            currentChoice.source === 'server'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`field-${choice.key}`}
                            value="server"
                            checked={currentChoice.source === 'server'}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleFieldChoice(choice.key, 'server');
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <Database className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">
                                Server
                              </span>
                            </div>
                            <div className="text-sm text-gray-700 font-mono whitespace-pre-line break-all">
                              {formatFieldValue(serverValue, choice.key)}
                            </div>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-100 border border-gray-200 rounded">
                        <div className="text-sm text-gray-600 mb-1">
                          Same value on both sides
                        </div>
                        <div className="text-sm text-gray-700 font-mono">
                          {formatFieldValue(localValue, choice.key)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Preview Step */}
        {currentStep === 'preview' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-900">
                  Final Merged Object
                </h4>
              </div>
              <p className="text-sm text-green-700">
                Review the final merged object. User-selected fields and
                auto-updated system fields are highlighted.
              </p>
              {impactedFields.length > 0 && (
                <p className="text-sm text-green-700 mt-1">
                  <strong>{impactedFields.length}</strong> field
                  {impactedFields.length !== 1 ? 's' : ''} will be updated.
                </p>
              )}
            </div>

            {/* System-managed fields info */}
            {systemFields.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Timestamp fields (
                  {systemFields.map((f) => f.key).join(', ')}) are automatically
                  managed and will be updated to the current time.
                </p>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">Merged Result</h5>
              <div className="space-y-2">
                {/* User-editable fields */}
                {Object.entries(mergedObject)
                  .filter(([key]) => !isSystemManagedField(key))
                  .map(([key, value]) => {
                    const choice = getCurrentChoice(key);
                    const wasChanged =
                      choice?.source !== 'local' ||
                      JSON.stringify(value) !== JSON.stringify(localData[key]);

                    return (
                      <div
                        key={key}
                        className={`p-2 rounded ${
                          wasChanged
                            ? 'bg-yellow-50 border border-yellow-200'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{key}</span>
                          {wasChanged && (
                            <span className="px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded">
                              Modified
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-700 font-mono whitespace-pre-line">
                          {formatFieldValue(value, key)}
                        </div>
                      </div>
                    );
                  })}

                {/* System-managed fields */}
                {Object.entries(mergedObject)
                  .filter(([key]) => isSystemManagedField(key))
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="p-2 rounded bg-blue-50 border border-blue-200"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{key}</span>
                        <span className="px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded">
                          Auto-Updated
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 font-mono whitespace-pre-line">
                        {formatFieldValue(value, key)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            {currentStep !== 'strategy' && (
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            {currentStep === 'preview' ? (
              <button
                onClick={handleResolve}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Check className="h-4 w-4" />
                <span>Apply Merge</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {currentStep === 'strategy' && selectedStrategy !== 'manual'
                  ? 'Resolve Conflict'
                  : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
