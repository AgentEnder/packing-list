/**
 * Deep object comparison and merging utilities for sync conflict detection
 */

export type DeepDiffResult = {
  hasConflicts: boolean;
  conflicts: Array<{
    path: string;
    localValue: unknown;
    serverValue: unknown;
    type: 'modified' | 'added' | 'removed';
  }>;
  mergedObject: Record<string, unknown>;
};

export type DiffPath = string[];

/**
 * Performs a deep comparison between two objects and identifies conflicts
 */
export function deepDiff(
  localData: Record<string, unknown>,
  serverData: Record<string, unknown>,
  ignorePaths: string[] = []
): DeepDiffResult {
  const conflicts: DeepDiffResult['conflicts'] = [];
  const mergedObject: Record<string, unknown> = {};

  // Get all unique keys from both objects
  const allKeys = new Set([
    ...Object.keys(localData),
    ...Object.keys(serverData),
  ]);

  for (const key of allKeys) {
    const path = key;

    // Skip ignored paths
    if (ignorePaths.includes(path)) {
      // For ignored paths, prefer server value
      mergedObject[key] = serverData[key] ?? localData[key];
      continue;
    }

    const localValue = localData[key];
    const serverValue = serverData[key];

    if (!(key in localData)) {
      // Key only exists in server data
      conflicts.push({
        path,
        localValue: undefined,
        serverValue,
        type: 'added',
      });
      mergedObject[key] = serverValue;
    } else if (!(key in serverData)) {
      // Key only exists in local data
      conflicts.push({
        path,
        localValue,
        serverValue: undefined,
        type: 'removed',
      });
      mergedObject[key] = localValue;
    } else {
      // Key exists in both - check for differences
      const result = compareValues(localValue, serverValue, [key]);

      if (result.hasConflicts) {
        conflicts.push(...result.conflicts);
        mergedObject[key] = result.mergedValue;
      } else {
        // No conflicts, use server value (prefer server for non-conflicting changes)
        mergedObject[key] = serverValue;
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    mergedObject,
  };
}

/**
 * Compares two values recursively and returns conflict information
 */
function compareValues(
  localValue: unknown,
  serverValue: unknown,
  path: DiffPath
): {
  hasConflicts: boolean;
  conflicts: DeepDiffResult['conflicts'];
  mergedValue: unknown;
} {
  const pathStr = path.join('.');

  // Handle null/undefined cases
  if (localValue === null || localValue === undefined) {
    if (serverValue === null || serverValue === undefined) {
      return { hasConflicts: false, conflicts: [], mergedValue: serverValue };
    }
    return {
      hasConflicts: true,
      conflicts: [{ path: pathStr, localValue, serverValue, type: 'modified' }],
      mergedValue: serverValue, // Prefer server value
    };
  }

  if (serverValue === null || serverValue === undefined) {
    return {
      hasConflicts: true,
      conflicts: [{ path: pathStr, localValue, serverValue, type: 'modified' }],
      mergedValue: localValue, // Keep local value
    };
  }

  // Handle primitive types
  if (typeof localValue !== 'object' || typeof serverValue !== 'object') {
    if (localValue === serverValue) {
      return { hasConflicts: false, conflicts: [], mergedValue: serverValue };
    }
    return {
      hasConflicts: true,
      conflicts: [{ path: pathStr, localValue, serverValue, type: 'modified' }],
      mergedValue: serverValue, // Prefer server value for primitive conflicts
    };
  }

  // Handle arrays
  if (Array.isArray(localValue) && Array.isArray(serverValue)) {
    return compareArrays(localValue, serverValue, path);
  }

  // Handle objects
  if (Array.isArray(localValue) || Array.isArray(serverValue)) {
    // Type mismatch: one is array, one is object
    return {
      hasConflicts: true,
      conflicts: [{ path: pathStr, localValue, serverValue, type: 'modified' }],
      mergedValue: serverValue, // Prefer server value
    };
  }

  return compareObjects(
    localValue as Record<string, unknown>,
    serverValue as Record<string, unknown>,
    path
  );
}

/**
 * Compares two arrays and returns conflict information
 */
function compareArrays(
  localArray: unknown[],
  serverArray: unknown[],
  path: DiffPath
): {
  hasConflicts: boolean;
  conflicts: DeepDiffResult['conflicts'];
  mergedValue: unknown[];
} {
  const pathStr = path.join('.');

  // For arrays, we'll use a simple strategy:
  // If lengths are different or any element is different, it's a conflict
  if (localArray.length !== serverArray.length) {
    return {
      hasConflicts: true,
      conflicts: [
        {
          path: pathStr,
          localValue: localArray,
          serverValue: serverArray,
          type: 'modified',
        },
      ],
      mergedValue: serverArray, // Prefer server value
    };
  }

  let hasConflicts = false;
  const conflicts: DeepDiffResult['conflicts'] = [];
  const mergedArray: unknown[] = [];

  for (let i = 0; i < localArray.length; i++) {
    const result = compareValues(localArray[i], serverArray[i], [
      ...path,
      i.toString(),
    ]);

    if (result.hasConflicts) {
      hasConflicts = true;
      conflicts.push(...result.conflicts);
    }

    mergedArray.push(result.mergedValue);
  }

  return {
    hasConflicts,
    conflicts,
    mergedValue: mergedArray,
  };
}

/**
 * Compares two objects and returns conflict information
 */
function compareObjects(
  localObj: Record<string, unknown>,
  serverObj: Record<string, unknown>,
  path: DiffPath
): {
  hasConflicts: boolean;
  conflicts: DeepDiffResult['conflicts'];
  mergedValue: Record<string, unknown>;
} {
  let hasConflicts = false;
  const conflicts: DeepDiffResult['conflicts'] = [];
  const mergedObj: Record<string, unknown> = {};

  // Get all unique keys from both objects
  const allKeys = new Set([
    ...Object.keys(localObj),
    ...Object.keys(serverObj),
  ]);

  for (const key of allKeys) {
    const newPath = [...path, key];
    const pathStr = newPath.join('.');

    if (!(key in localObj)) {
      // Key only exists in server object
      conflicts.push({
        path: pathStr,
        localValue: undefined,
        serverValue: serverObj[key],
        type: 'added',
      });
      mergedObj[key] = serverObj[key];
      hasConflicts = true;
    } else if (!(key in serverObj)) {
      // Key only exists in local object
      conflicts.push({
        path: pathStr,
        localValue: localObj[key],
        serverValue: undefined,
        type: 'removed',
      });
      mergedObj[key] = localObj[key];
      hasConflicts = true;
    } else {
      // Key exists in both - compare values
      const result = compareValues(localObj[key], serverObj[key], newPath);

      if (result.hasConflicts) {
        hasConflicts = true;
        conflicts.push(...result.conflicts);
      }

      mergedObj[key] = result.mergedValue;
    }
  }

  return {
    hasConflicts,
    conflicts,
    mergedValue: mergedObj,
  };
}

/**
 * Checks if two values are deeply equal
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a === null || a === undefined || b === null || b === undefined) {
    return a === b;
  }

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => key in bObj && deepEqual(aObj[key], bObj[key]));
}

/**
 * Creates a smart merge of two objects, handling nested conflicts intelligently
 */
export function smartMerge(
  localData: Record<string, unknown>,
  serverData: Record<string, unknown>,
  resolutionStrategy:
    | 'prefer-server'
    | 'prefer-local'
    | 'manual' = 'prefer-server'
): Record<string, unknown> {
  const diffResult = deepDiff(localData, serverData);

  if (!diffResult.hasConflicts) {
    // No conflicts, return server data with any local-only additions
    return diffResult.mergedObject;
  }

  // Handle conflicts based on strategy
  const result = { ...diffResult.mergedObject };

  for (const conflict of diffResult.conflicts) {
    const keys = conflict.path.split('.');
    let current = result;

    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    const finalKey = keys[keys.length - 1];

    switch (resolutionStrategy) {
      case 'prefer-server':
        if (conflict.serverValue !== undefined) {
          current[finalKey] = conflict.serverValue;
        }
        break;
      case 'prefer-local':
        if (conflict.localValue !== undefined) {
          current[finalKey] = conflict.localValue;
        }
        break;
      case 'manual':
        // For manual resolution, we'll keep the server value and let the UI handle it
        if (conflict.serverValue !== undefined) {
          current[finalKey] = conflict.serverValue;
        }
        break;
    }
  }

  return result;
}

/**
 * Gets the default paths to ignore during sync conflict detection
 * These are typically system-managed fields that shouldn't cause conflicts
 */
export function getDefaultIgnorePaths(): string[] {
  return [
    'timestamp',
    'updatedAt',
    'updated_at',
    'lastModified',
    'last_modified',
    'lastSyncedAt',
    'last_synced_at',
    'version', // Version conflicts are handled separately
  ];
}
