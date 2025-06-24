/**
 * Deep equality check for objects that ignores key order and handles arrays properly.
 * This is used for sync conflict detection to avoid false positives when object
 * property order changes due to serialization/deserialization.
 */
export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return obj1 === obj2;

  if (typeof obj1 !== typeof obj2) return false;

  if (typeof obj1 !== 'object') return obj1 === obj2;

  // Handle arrays
  if (Array.isArray(obj1) || Array.isArray(obj2)) {
    if (!Array.isArray(obj1) || !Array.isArray(obj2)) return false;
    if (obj1.length !== obj2.length) return false;

    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false;
    }
    return true;
  }

  // Handle objects - sort keys to ignore order
  const keys1 = Object.keys(obj1 as Record<string, unknown>).sort();
  const keys2 = Object.keys(obj2 as Record<string, unknown>).sort();

  if (keys1.length !== keys2.length) return false;

  for (let i = 0; i < keys1.length; i++) {
    if (keys1[i] !== keys2[i]) return false;

    const val1 = (obj1 as Record<string, unknown>)[keys1[i]];
    const val2 = (obj2 as Record<string, unknown>)[keys2[i]];

    if (!deepEqual(val1, val2)) return false;
  }

  return true;
}

/**
 * Generate detailed conflict information for nested objects
 */
export interface ConflictDetail {
  path: string;
  type: 'modified' | 'added' | 'removed';
  localValue: unknown;
  serverValue: unknown;
}

export function generateDetailedConflicts(
  localData: Record<string, unknown>,
  serverData: Record<string, unknown>,
  basePath = ''
): ConflictDetail[] {
  const conflicts: ConflictDetail[] = [];

  const allKeys = new Set([
    ...Object.keys(localData),
    ...Object.keys(serverData),
  ]);

  for (const key of allKeys) {
    const currentPath = basePath ? `${basePath}.${key}` : key;
    const localValue = localData[key];
    const serverValue = serverData[key];

    // Treat undefined values and missing keys as equivalent
    const localHasValue = key in localData && localValue !== undefined;
    const serverHasValue = key in serverData && serverValue !== undefined;

    if (!localHasValue && serverHasValue) {
      conflicts.push({
        path: currentPath,
        type: 'added',
        localValue: undefined,
        serverValue,
      });
    } else if (localHasValue && !serverHasValue) {
      conflicts.push({
        path: currentPath,
        type: 'removed',
        localValue,
        serverValue: undefined,
      });
    } else if (
      localHasValue &&
      serverHasValue &&
      !deepEqual(localValue, serverValue)
    ) {
      // Check if both values are objects and can be recursively compared
      if (
        localValue &&
        serverValue &&
        typeof localValue === 'object' &&
        typeof serverValue === 'object' &&
        !Array.isArray(localValue) &&
        !Array.isArray(serverValue)
      ) {
        // Recursively find nested conflicts
        const nestedConflicts = generateDetailedConflicts(
          localValue as Record<string, unknown>,
          serverValue as Record<string, unknown>,
          currentPath
        );
        conflicts.push(...nestedConflicts);
      } else {
        // Values are different and not recursively comparable
        conflicts.push({
          path: currentPath,
          type: 'modified',
          localValue,
          serverValue,
        });
      }
    }
  }

  return conflicts;
}
