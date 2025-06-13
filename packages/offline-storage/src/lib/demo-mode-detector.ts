/**
 * Utility to detect demo mode and prevent persistence of demo data
 */

/**
 * Check if we're currently in demo mode based on various indicators
 */
export function isDemoMode(): boolean {
  // Only run in browser environment
  if (typeof (globalThis as { window?: unknown }).window === 'undefined') {
    return false;
  }

  // Check if demo trip is selected (most reliable indicator)
  try {
    // Try to access Redux state if available
    const stateStr = (
      globalThis as {
        sessionStorage?: { getItem: (key: string) => string | null };
      }
    ).sessionStorage?.getItem('redux-state');
    if (stateStr) {
      const state = JSON.parse(stateStr);
      if (state?.trips?.selectedTripId === 'DEMO_TRIP') {
        return true;
      }
    }
  } catch {
    // Ignore parsing errors
  }

  // Check session storage for demo choice
  const demoChoice = (
    globalThis as {
      sessionStorage?: { getItem: (key: string) => string | null };
    }
  ).sessionStorage?.getItem('session-demo-choice');
  if (demoChoice === 'demo') {
    return true;
  }

  return false;
}

/**
 * Check if a trip ID indicates demo data
 */
export function isDemoTripId(tripId: string): boolean {
  return (
    tripId === 'DEMO_TRIP' ||
    tripId.startsWith('demo-') ||
    tripId.includes('demo')
  );
}

/**
 * Check if an entity ID indicates demo data
 */
export function isDemoEntityId(entityId: string): boolean {
  return (
    entityId.startsWith('demo-') ||
    entityId.startsWith('person-') ||
    entityId.startsWith('item-') ||
    entityId.includes('demo')
  );
}

/**
 * Check if we should skip persistence for this data
 */
export function shouldSkipPersistence(
  tripId?: string,
  entityId?: string
): boolean {
  // If we're in demo mode, skip all persistence
  if (isDemoMode()) {
    console.log('🎭 [DEMO MODE] Skipping persistence - demo mode active');
    return true;
  }

  // If trip ID indicates demo data, skip persistence
  if (tripId && isDemoTripId(tripId)) {
    console.log(`🎭 [DEMO MODE] Skipping persistence - demo trip: ${tripId}`);
    return true;
  }

  // If entity ID indicates demo data, skip persistence
  if (entityId && isDemoEntityId(entityId)) {
    console.log(
      `🎭 [DEMO MODE] Skipping persistence - demo entity: ${entityId}`
    );
    return true;
  }

  return false;
}
