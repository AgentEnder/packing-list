import type { SyncConflict } from '@packing-list/model';
import { getSyncService } from './sync.js';

export interface ConflictResolutionStrategy {
  strategy: 'local' | 'server' | 'manual';
  manualData?: unknown;
  reason?: string;
}

export class ConflictResolver {
  private syncService = getSyncService();

  /**
   * Get all current conflicts
   */
  async getConflicts(): Promise<SyncConflict[]> {
    const state = await this.syncService.getSyncState();
    return state.conflicts;
  }

  /**
   * Resolve a conflict using a simple strategy
   */
  async resolveConflict(
    conflictId: string,
    strategy: ConflictResolutionStrategy
  ): Promise<void> {
    await this.syncService.resolveConflict(conflictId, strategy.strategy);

    console.log(
      `[ConflictResolver] Resolved conflict ${conflictId} using ${
        strategy.strategy
      } strategy${strategy.reason ? `: ${strategy.reason}` : ''}`
    );
  }

  /**
   * Resolve all conflicts using a default strategy
   */
  async resolveAllConflicts(
    defaultStrategy: 'local' | 'server'
  ): Promise<void> {
    const conflicts = await this.getConflicts();

    for (const conflict of conflicts) {
      await this.resolveConflict(conflict.id, {
        strategy: defaultStrategy,
        reason: `Bulk resolution using ${defaultStrategy} preference`,
      });
    }

    console.log(
      `[ConflictResolver] Resolved ${conflicts.length} conflicts using ${defaultStrategy} strategy`
    );
  }

  /**
   * Analyze conflicts and suggest resolution strategies
   */
  async analyzeConflicts(): Promise<
    Array<{
      conflict: SyncConflict;
      suggestedStrategy: ConflictResolutionStrategy;
      confidence: 'high' | 'medium' | 'low';
    }>
  > {
    const conflicts = await this.getConflicts();

    return conflicts.map((conflict) => {
      const analysis = this.analyzeConflict(conflict);
      return {
        conflict,
        suggestedStrategy: analysis.strategy,
        confidence: analysis.confidence,
      };
    });
  }

  /**
   * Analyze a single conflict and suggest a resolution strategy
   */
  private analyzeConflict(conflict: SyncConflict): {
    strategy: ConflictResolutionStrategy;
    confidence: 'high' | 'medium' | 'low';
  } {
    // Simple heuristics for conflict resolution
    const localVersion = conflict.localVersion as Record<string, unknown>;
    const serverVersion = conflict.serverVersion as Record<string, unknown>;

    // If local version has more recent timestamp, prefer local
    if (localVersion?.timestamp && serverVersion?.timestamp) {
      if (localVersion.timestamp > serverVersion.timestamp) {
        return {
          strategy: {
            strategy: 'local',
            reason: 'Local version is more recent',
          },
          confidence: 'high',
        };
      } else {
        return {
          strategy: {
            strategy: 'server',
            reason: 'Server version is more recent',
          },
          confidence: 'high',
        };
      }
    }

    // If local version has more data fields, prefer local
    if (typeof localVersion === 'object' && typeof serverVersion === 'object') {
      const localKeys = Object.keys(localVersion || {});
      const serverKeys = Object.keys(serverVersion || {});

      if (localKeys.length > serverKeys.length) {
        return {
          strategy: {
            strategy: 'local',
            reason: 'Local version has more data',
          },
          confidence: 'medium',
        };
      } else if (serverKeys.length > localKeys.length) {
        return {
          strategy: {
            strategy: 'server',
            reason: 'Server version has more data',
          },
          confidence: 'medium',
        };
      }
    }

    // Default to manual resolution for complex cases
    return {
      strategy: {
        strategy: 'manual',
        reason: 'Complex conflict requiring manual review',
      },
      confidence: 'low',
    };
  }

  /**
   * Create a merged version of conflicting data
   */
  createMergedVersion(conflict: SyncConflict): unknown {
    const localVersion = conflict.localVersion as Record<string, unknown>;
    const serverVersion = conflict.serverVersion as Record<string, unknown>;

    if (typeof localVersion === 'object' && typeof serverVersion === 'object') {
      // Simple merge: server data takes precedence, but keep local additions
      return {
        ...localVersion,
        ...serverVersion,
        // Keep timestamp as the more recent one
        timestamp: Math.max(
          (localVersion?.timestamp as number) || 0,
          (serverVersion?.timestamp as number) || 0
        ),
        // Mark as merged for tracking
        mergedFrom: {
          local: localVersion,
          server: serverVersion,
          mergedAt: Date.now(),
        },
      };
    }

    // For non-objects, return server version by default
    return serverVersion;
  }

  /**
   * Resolve a conflict with a merged version
   */
  async resolveWithMerge(conflictId: string): Promise<void> {
    const conflicts = await this.getConflicts();
    const conflict = conflicts.find((c) => c.id === conflictId);

    if (!conflict) {
      throw new Error(`Conflict not found: ${conflictId}`);
    }

    const mergedData = this.createMergedVersion(conflict);

    await this.resolveConflict(conflictId, {
      strategy: 'manual',
      manualData: mergedData,
      reason: 'Automatic merge of local and server changes',
    });
  }
}

// Global conflict resolver instance
let conflictResolverInstance: ConflictResolver | null = null;

/**
 * Get the global conflict resolver instance
 */
export function getConflictResolver(): ConflictResolver {
  if (!conflictResolverInstance) {
    conflictResolverInstance = new ConflictResolver();
  }
  return conflictResolverInstance;
}
