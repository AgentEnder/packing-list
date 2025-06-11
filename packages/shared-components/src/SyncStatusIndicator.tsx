import React from 'react';
import {
  Wifi,
  WifiOff,
  RotateCw,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import type { SyncState } from '@packing-list/model';

export interface SyncStatusIndicatorProps {
  syncState: SyncState;
  onClick?: () => void;
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  syncState,
  onClick,
  className = '',
}) => {
  const { isOnline, isSyncing, pendingChanges, conflicts } = syncState;

  const getSyncStatus = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        text: 'Offline',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        pulse: false,
      };
    }

    if (conflicts.length > 0) {
      return {
        icon: AlertTriangle,
        text: `${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''}`,
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100',
        pulse: true,
      };
    }

    if (isSyncing) {
      return {
        icon: RotateCw,
        text: 'Syncing...',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        pulse: false,
        spin: true,
      };
    }

    if (pendingChanges.length > 0) {
      return {
        icon: Clock,
        text: `${pendingChanges.length} pending`,
        color: 'text-orange-700',
        bgColor: 'bg-orange-100',
        pulse: false,
      };
    }

    return {
      icon: CheckCircle,
      text: 'Synced',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      pulse: false,
    };
  };

  const status = getSyncStatus();
  const Icon = status.icon;

  const baseClasses = `
    flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium
    transition-all duration-200 cursor-pointer hover:shadow-md
    ${status.bgColor} ${status.color}
    ${status.pulse ? 'animate-pulse' : ''}
    ${className}
  `;

  return (
    <div className={baseClasses} onClick={onClick}>
      <Icon className={`h-4 w-4 ${status.spin ? 'animate-spin' : ''}`} />
      <span>{status.text}</span>

      {/* Network indicator */}
      <div className="flex items-center">
        {isOnline ? (
          <Wifi className="h-3 w-3 text-green-600" />
        ) : (
          <WifiOff className="h-3 w-3 text-gray-400" />
        )}
      </div>
    </div>
  );
};

export interface SyncStatusBadgeProps {
  syncState: SyncState;
  onClick?: () => void;
  showText?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  syncState,
  onClick,
  showText = true,
}) => {
  const { isOnline, isSyncing, pendingChanges, conflicts } = syncState;

  if (conflicts.length > 0) {
    return (
      <button
        onClick={onClick}
        className="relative inline-flex items-center justify-center p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-full transition-colors"
        title={`${conflicts.length} sync conflict${
          conflicts.length > 1 ? 's' : ''
        } need resolution`}
        data-testid="sync-conflict-badge"
      >
        <AlertTriangle className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold animate-pulse">
          {conflicts.length > 9 ? '9+' : conflicts.length}
        </span>
        {showText && (
          <span className="ml-2 text-sm font-medium">
            {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
          </span>
        )}
      </button>
    );
  }

  if (!isOnline) {
    return (
      <div
        className="inline-flex items-center justify-center p-2 text-gray-500"
        title="Offline - changes will sync when online"
        data-testid="sync-offline-badge"
      >
        <WifiOff className="h-5 w-5" />
        {showText && <span className="ml-2 text-sm">Offline</span>}
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div
        className="inline-flex items-center justify-center p-2 text-blue-600"
        title="Syncing changes..."
        data-testid="sync-syncing-badge"
      >
        <RotateCw className="h-5 w-5 animate-spin" />
        {showText && <span className="ml-2 text-sm">Syncing...</span>}
      </div>
    );
  }

  if (pendingChanges.length > 0) {
    return (
      <button
        onClick={onClick}
        className="relative inline-flex items-center justify-center p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-full transition-colors"
        title={`${pendingChanges.length} change${
          pendingChanges.length > 1 ? 's' : ''
        } pending sync`}
        data-testid="sync-pending-badge"
      >
        <Clock className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
          {pendingChanges.length > 9 ? '9+' : pendingChanges.length}
        </span>
        {showText && (
          <span className="ml-2 text-sm">{pendingChanges.length} pending</span>
        )}
      </button>
    );
  }

  return (
    <div
      className="inline-flex items-center justify-center p-2 text-green-600"
      title="All changes synced"
      data-testid="sync-synced-badge"
    >
      <CheckCircle className="h-5 w-5" />
      {showText && <span className="ml-2 text-sm">Synced</span>}
    </div>
  );
};
