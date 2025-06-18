/**
 * Calculates and formats the time elapsed since the last build
 */
export function getTimeSinceLastBuild(): string {
  try {
    const buildTimeString = import.meta.env.VITE_BUILD_TIME;

    if (!buildTimeString) {
      console.warn('🛠️ [BUILD TIME] VITE_BUILD_TIME not available');
      return 'Unknown';
    }

    const buildTime = new Date(buildTimeString);
    const now = new Date();
    const diffMs = now.getTime() - buildTime.getTime();

    // Handle invalid build time
    if (isNaN(buildTime.getTime()) || diffMs < 0) {
      console.warn('🛠️ [BUILD TIME] Invalid build time:', buildTimeString);
      return 'Unknown';
    }

    return formatDuration(diffMs);
  } catch (error) {
    console.error('🛠️ [BUILD TIME] Error calculating time since build:', error);
    return 'Unknown';
  }
}

/**
 * Formats a duration in milliseconds to a human-readable string
 * Optimized for live updates with more precision for shorter durations
 */
function formatDuration(durationMs: number): string {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else if (seconds > 0) {
    return `${seconds}s`;
  } else {
    return 'Just now';
  }
}
