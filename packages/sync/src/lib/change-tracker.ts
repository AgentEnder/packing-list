import type {
  Change,
  Trip,
  Person,
  TripItem,
  RuleOverride,
} from '@packing-list/model';
import { getSyncService } from './sync.js';

export class ChangeTracker {
  private syncService = getSyncService();

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
