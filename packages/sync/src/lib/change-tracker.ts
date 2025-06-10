import type {
  Change,
  Trip,
  Person,
  TripItem,
  RuleOverride,
} from '@packing-list/model';
import { getSyncService } from './sync.js';

// Helper function to check if a user is local and should not sync to remote
function isLocalUser(userId: string): boolean {
  return (
    userId === 'local-shared-user' ||
    userId === 'local-user' ||
    userId.startsWith('local-')
  );
}

export class ChangeTracker {
  private syncService = getSyncService();

  /**
   * Check if a user ID represents a local user (non-syncing)
   */
  static isLocalUser(userId: string): boolean {
    return isLocalUser(userId);
  }

  /**
   * Track a trip change
   */
  async trackTripChange(
    operation: 'create' | 'update' | 'delete',
    trip: Trip,
    userId: string
  ): Promise<void> {
    const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
      entityType: 'trip',
      entityId: trip.id,
      operation,
      data: trip,
      userId,
      tripId: trip.id,
      version: trip.version || 1,
    };

    await this.syncService.trackChange(change);
  }

  /**
   * Track a person change
   */
  async trackPersonChange(
    operation: 'create' | 'update' | 'delete',
    person: Person,
    userId: string,
    tripId: string
  ): Promise<void> {
    const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
      entityType: 'person',
      entityId: person.id,
      operation,
      data: person,
      userId,
      tripId,
      version: person.version || 1,
    };

    await this.syncService.trackChange(change);
  }

  /**
   * Track an item change
   */
  async trackItemChange(
    operation: 'create' | 'update' | 'delete',
    item: TripItem,
    userId: string,
    tripId: string
  ): Promise<void> {
    const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
      entityType: 'item',
      entityId: item.id,
      operation,
      data: item,
      userId,
      tripId,
      version: item.version || 1,
    };

    await this.syncService.trackChange(change);
  }

  /**
   * Track a packing status change (optimized for frequent updates)
   * This creates a lightweight change record focused on packing status
   */
  async trackPackingStatusChange(
    itemId: string,
    isPacked: boolean,
    userId: string,
    tripId: string,
    metadata?: {
      timestamp?: number;
      previousStatus?: boolean;
      bulkOperation?: boolean;
    }
  ): Promise<void> {
    const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
      entityType: 'item',
      entityId: itemId,
      operation: 'update',
      data: {
        id: itemId,
        packed: isPacked,
        updatedAt: new Date().toISOString(),
        // Only include the packing status change for efficient sync
        _packingStatusOnly: true,
        _previousStatus: metadata?.previousStatus,
        _bulkOperation: metadata?.bulkOperation || false,
      },
      userId,
      tripId,
      version: 1, // Increment will be handled by server
    };

    await this.syncService.trackChange(change);
  }

  /**
   * Track multiple packing status changes as a batch operation
   * This is more efficient for bulk packing/unpacking scenarios
   */
  async trackBulkPackingChanges(
    changes: Array<{
      itemId: string;
      isPacked: boolean;
      previousStatus?: boolean;
    }>,
    userId: string,
    tripId: string
  ): Promise<void> {
    // Create a single batch change for all packing updates
    const batchChange: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
      entityType: 'item',
      entityId: `bulk_packing_${Date.now()}`, // Unique ID for batch operation
      operation: 'update',
      data: {
        bulkPackingUpdate: true,
        changes: changes.map((change) => ({
          itemId: change.itemId,
          packed: change.isPacked,
          previousStatus: change.previousStatus,
        })),
        updatedAt: new Date().toISOString(),
      },
      userId,
      tripId,
      version: 1,
    };

    await this.syncService.trackChange(batchChange);
  }

  /**
   * Track a rule override change
   */
  async trackRuleOverrideChange(
    operation: 'create' | 'update' | 'delete',
    ruleOverride: RuleOverride,
    userId: string,
    tripId: string
  ): Promise<void> {
    // Generate a composite ID for rule overrides since they don't have a single ID field
    const entityId = `${ruleOverride.ruleId}_${ruleOverride.tripId}_${
      ruleOverride.personId || 'all'
    }_${ruleOverride.dayIndex || 'all'}`;

    const change: Omit<Change, 'id' | 'timestamp' | 'synced'> = {
      entityType: 'rule_override',
      entityId,
      operation,
      data: ruleOverride,
      userId,
      tripId,
      version: 1, // Rule overrides don't have versions, so default to 1
    };

    await this.syncService.trackChange(change);
  }

  /**
   * Get pending changes count
   */
  async getPendingChangesCount(): Promise<number> {
    const state = await this.syncService.getSyncState();
    return state.pendingChanges.length;
  }

  /**
   * Get conflicts count
   */
  async getConflictsCount(): Promise<number> {
    const state = await this.syncService.getSyncState();
    return state.conflicts.length;
  }

  /**
   * Check if there are pending changes
   */
  async hasPendingChanges(): Promise<boolean> {
    const count = await this.getPendingChangesCount();
    return count > 0;
  }

  /**
   * Check if there are conflicts
   */
  async hasConflicts(): Promise<boolean> {
    const count = await this.getConflictsCount();
    return count > 0;
  }

  /**
   * Get pending packing changes specifically
   */
  async getPendingPackingChanges(): Promise<number> {
    const state = await this.syncService.getSyncState();
    return state.pendingChanges.filter(
      (change) =>
        change.entityType === 'item' &&
        (change.data as { _packingStatusOnly?: boolean })
          ?._packingStatusOnly === true
    ).length;
  }
}

// Global change tracker instance
let changeTrackerInstance: ChangeTracker | null = null;

/**
 * Get the global change tracker instance
 */
export function getChangeTracker(): ChangeTracker {
  if (!changeTrackerInstance) {
    changeTrackerInstance = new ChangeTracker();
  }
  return changeTrackerInstance;
}
