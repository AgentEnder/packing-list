import { render, screen, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictResolutionModal } from '../ConflictResolutionModal.js';
import type { SyncConflict } from '@packing-list/model';

// Mock the icons to avoid import issues
vi.mock('lucide-react', () => ({
  AlertTriangle: ({ className }: { className?: string }) => (
    <div data-testid="alert-triangle" className={className} />
  ),
  Database: ({ className }: { className?: string }) => (
    <div data-testid="database" className={className} />
  ),
  Smartphone: ({ className }: { className?: string }) => (
    <div data-testid="smartphone" className={className} />
  ),
  Merge: ({ className }: { className?: string }) => (
    <div data-testid="merge" className={className} />
  ),
  ArrowLeft: ({ className }: { className?: string }) => (
    <div data-testid="arrow-left" className={className} />
  ),
  Check: ({ className }: { className?: string }) => (
    <div data-testid="check" className={className} />
  ),
  Eye: ({ className }: { className?: string }) => (
    <div data-testid="eye" className={className} />
  ),
  ChevronDown: ({ className }: { className?: string }) => (
    <div data-testid="chevron-down" className={className} />
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <div data-testid="chevron-right" className={className} />
  ),
  Plus: ({ className }: { className?: string }) => (
    <div data-testid="plus" className={className} />
  ),
  Minus: ({ className }: { className?: string }) => (
    <div data-testid="minus" className={className} />
  ),
  Edit3: ({ className }: { className?: string }) => (
    <div data-testid="edit3" className={className} />
  ),
  X: ({ className }: { className?: string }) => (
    <div data-testid="x" className={className} />
  ),
}));

describe('ConflictResolutionModal', () => {
  const mockOnResolve = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createBasicConflict = (): SyncConflict => ({
    id: 'conflict-1',
    entityType: 'trip',
    entityId: 'trip-123',
    localVersion: {
      id: 'trip-123',
      title: 'Local Trip Title',
      description: 'Local description',
      timestamp: 1640995200000, // 2022-01-01
    },
    serverVersion: {
      id: 'trip-123',
      title: 'Server Trip Title',
      description: 'Server description',
      timestamp: 1641081600000, // 2022-01-02
    },
    conflictType: 'update_conflict',
    timestamp: Date.now(),
  });

  const createEnhancedNestedConflict = (): SyncConflict => ({
    id: 'conflict-nested',
    entityType: 'trip',
    entityId: 'trip-456',
    localVersion: {
      id: 'trip-456',
      title: 'European Adventure',
      settings: { timezone: 'Europe/Paris' },
      days: [
        {
          date: '2024-03-01',
          location: 'Paris',
          items: [
            { name: 'Passport', packed: false },
            { name: 'Camera', packed: true },
          ],
        },
        {
          date: '2024-03-02',
          location: 'London',
          items: [{ name: 'Umbrella', packed: false }],
        },
      ],
      timestamp: 1640995200000,
    },
    serverVersion: {
      id: 'trip-456',
      title: 'European Adventure',
      settings: { timezone: 'Europe/Paris' },
      days: [
        {
          date: '2024-03-01',
          location: 'Paris',
          items: [
            { name: 'Passport', packed: false },
            { name: 'Camera', packed: true },
          ],
        },
        {
          date: '2024-03-02',
          location: 'London',
          items: [
            { name: 'Umbrella', packed: true }, // Only this changed
          ],
        },
      ],
      timestamp: 1641081600000,
    },
    conflictType: 'update_conflict',
    timestamp: Date.now(),
    // Enhanced conflict details for nested objects
    conflictDetails: {
      conflicts: [
        {
          path: 'days.1.items.0.packed',
          localValue: false,
          serverValue: true,
          type: 'modified',
        },
      ],
      mergedObject: {
        id: 'trip-456',
        title: 'European Adventure',
        settings: { timezone: 'Europe/Paris' },
        days: [
          {
            date: '2024-03-01',
            location: 'Paris',
            items: [
              { name: 'Passport', packed: false },
              { name: 'Camera', packed: true },
            ],
          },
          {
            date: '2024-03-02',
            location: 'London',
            items: [
              { name: 'Umbrella', packed: false }, // Default to local value
            ],
          },
        ],
      },
    },
  });

  describe('Basic Functionality', () => {
    it('should render the modal with basic conflict information', () => {
      const conflict = createBasicConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Resolve Sync Conflict')).toBeInTheDocument();
      expect(screen.getByText('Sync Conflict Detected')).toBeInTheDocument();
      expect(screen.getByText('Trip: Local Trip Title')).toBeInTheDocument();
    });

    it('should show resolution strategy options', () => {
      const conflict = createBasicConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Keep Local Changes')).toBeInTheDocument();
      expect(screen.getByText('Use Server Version')).toBeInTheDocument();
      expect(screen.getByText('Merge Field by Field')).toBeInTheDocument();
    });

    it('should handle basic conflict resolution strategies', async () => {
      const user = userEvent.setup();
      const conflict = createBasicConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Test local strategy
      await user.click(screen.getByDisplayValue('local'));
      await user.click(screen.getByText('Resolve Conflict'));

      expect(mockOnResolve).toHaveBeenCalledWith('local');
    });
  });

  describe('Enhanced Nested Object Conflict Detection', () => {
    it('should display enhanced conflict details for nested objects', () => {
      const conflict = createEnhancedNestedConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Should show the enhanced conflict count
      expect(screen.getByText(/\(1 field conflicted\)/)).toBeInTheDocument();

      // Should show the ConflictDiffView with proper diff information
      expect(screen.getByText('1 field changed')).toBeInTheDocument();

      // Should display the nested conflict path (appears in multiple places)
      expect(screen.getAllByText('days.1.items.0.packed')).toHaveLength(2);

      // Should show the conflict type (changed) - find the specific conflict type span
      const conflictTypeElements = screen.getAllByText('changed');
      expect(conflictTypeElements.length).toBeGreaterThan(0);
      // Find the one with uppercase styling (text-xs text-gray-500 uppercase)
      const conflictTypeSpan = conflictTypeElements.find(
        (el) =>
          (el as HTMLElement).className.includes('text-xs') &&
          (el as HTMLElement).className.includes('uppercase')
      );
      expect(conflictTypeSpan).toBeInTheDocument();

      // Should show nested indicator
      expect(screen.getByText('Nested')).toBeInTheDocument();
    });

    it('should handle manual merge with nested conflicts', async () => {
      const user = userEvent.setup();
      const conflict = createEnhancedNestedConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Select manual merge strategy
      await user.click(screen.getByDisplayValue('manual'));
      await user.click(screen.getByText('Next'));

      // Should navigate to merge step
      expect(screen.getByText('Choose Field Values')).toBeInTheDocument();
      expect(screen.getByText('Field Selection')).toBeInTheDocument();
    });

    it('should preserve unchanged nested data in smart merge', async () => {
      const user = userEvent.setup();
      const conflict = createEnhancedNestedConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Navigate through manual merge flow
      await user.click(screen.getByDisplayValue('manual'));
      await user.click(screen.getByText('Next'));

      // Skip to preview (assuming no field changes needed)
      await user.click(screen.getByText('Next'));

      // Should show preview step
      expect(screen.getByText('Review Merged Object')).toBeInTheDocument();
      expect(screen.getByText('Final Merged Object')).toBeInTheDocument();

      // Apply the merge
      await user.click(screen.getByText('Apply Merge'));

      // Should call onResolve with the merged object
      expect(mockOnResolve).toHaveBeenCalledWith(
        'manual',
        expect.objectContaining({
          id: 'trip-456',
          title: 'European Adventure',
          settings: { timezone: 'Europe/Paris' },
          days: expect.arrayContaining([
            expect.objectContaining({
              date: '2024-03-01',
              location: 'Paris',
            }),
            expect.objectContaining({
              date: '2024-03-02',
              location: 'London',
            }),
          ]),
        })
      );
    });

    it('should show system-managed field information', () => {
      const conflict = createEnhancedNestedConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to merge step to see system field info
      fireEvent.click(screen.getByDisplayValue('manual'));
      fireEvent.click(screen.getByText('Next'));

      expect(
        screen.getByText(/timestamp.*are excluded and will be auto-updated/)
      ).toBeInTheDocument();
    });
  });

  describe('Field-by-Field Resolution', () => {
    it('should allow field-by-field selection in merge step', async () => {
      const user = userEvent.setup();
      const conflict = createBasicConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to merge step
      await user.click(screen.getByDisplayValue('manual'));
      await user.click(screen.getByText('Next'));

      // Should show field selection interface
      expect(screen.getByText('Field Selection')).toBeInTheDocument();

      // Should show conflicted fields
      expect(screen.getByText('title')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();

      // Should show local and server options for conflicted fields
      const localOptions = screen.getAllByDisplayValue('local');
      const serverOptions = screen.getAllByDisplayValue('server');
      expect(localOptions.length).toBeGreaterThan(0);
      expect(serverOptions.length).toBeGreaterThan(0);
    });

    it('should update field choices when user selects different values', async () => {
      const user = userEvent.setup();
      const conflict = createBasicConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to merge step
      await user.click(screen.getByDisplayValue('manual'));
      await user.click(screen.getByText('Next'));

      // Select server value for title field (there are multiple server radios, so we get the first one)
      const serverRadios = screen.getAllByDisplayValue('server');
      await user.click(serverRadios[0]); // Click the first server radio (title field)

      // Navigate to preview
      await user.click(screen.getByText('Next'));

      // Should show the updated field in preview
      expect(screen.getByText('Final Merged Object')).toBeInTheDocument();
    });
  });

  describe('Navigation and UI Flow', () => {
    it('should support back navigation between steps', async () => {
      const user = userEvent.setup();
      const conflict = createBasicConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Navigate forward
      await user.click(screen.getByDisplayValue('manual'));
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Choose Field Values')).toBeInTheDocument();

      // Navigate back
      await user.click(screen.getByText('Back'));
      expect(screen.getByText('Resolve Sync Conflict')).toBeInTheDocument();
    });

    it('should show progress indicators', () => {
      const conflict = createBasicConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Should show step indicators
      expect(screen.getByText('Strategy')).toBeInTheDocument();
      expect(screen.getByText('Merge')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('should handle cancel action', async () => {
      const user = userEvent.setup();
      const conflict = createBasicConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText('Cancel'));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Integration with ConflictDiffView', () => {
    it('should display real diff view with conflict details', () => {
      const conflict = createEnhancedNestedConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Should show the diff summary
      expect(screen.getByText('1 field changed')).toBeInTheDocument();

      // Should show expand/collapse controls
      expect(screen.getByText('Collapse details')).toBeInTheDocument();

      // Should display the specific nested conflict (appears in multiple places)
      expect(screen.getAllByText('days.1.items.0.packed')).toHaveLength(2);

      // Should show the conflict values
      expect(screen.getByText('Local Version')).toBeInTheDocument();
      expect(screen.getByText('Server Version')).toBeInTheDocument();

      // Should display boolean values for the packed field
      expect(screen.getByText('false')).toBeInTheDocument();
      expect(screen.getByText('true')).toBeInTheDocument();
    });

    it('should show enhanced diff view with nested path information', () => {
      const conflict = createEnhancedNestedConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Should show the path information for nested conflicts
      expect(screen.getByText('Path:')).toBeInTheDocument();
      expect(screen.getAllByText('days.1.items.0.packed')).toHaveLength(2);

      // Should show nested indicator badge
      expect(screen.getByText('Nested')).toBeInTheDocument();

      // Should show conflict type (changed) - find the specific conflict type span
      const conflictTypeElements = screen.getAllByText('changed');
      expect(conflictTypeElements.length).toBeGreaterThan(0);
      // Find the one with uppercase styling (text-xs text-gray-500 uppercase)
      const conflictTypeSpan = conflictTypeElements.find(
        (el) =>
          el.className.includes('text-xs') && el.className.includes('uppercase')
      );
      expect(conflictTypeSpan).toBeInTheDocument();
    });

    it('should handle basic conflicts without enhanced details', () => {
      const conflict = createBasicConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Should show multiple field changes for basic conflict
      expect(screen.getByText(/\d+ fields? changed/)).toBeInTheDocument();

      // Should show individual field changes
      expect(screen.getByText('title')).toBeInTheDocument();
      expect(screen.getByText('description')).toBeInTheDocument();

      // Should show the different values
      expect(screen.getByText('"Local Trip Title"')).toBeInTheDocument();
      expect(screen.getByText('"Server Trip Title"')).toBeInTheDocument();
    });

    it('should allow expanding and collapsing diff details', async () => {
      const user = userEvent.setup();
      const conflict = createBasicConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Should be expanded by default
      expect(screen.getByText('Collapse details')).toBeInTheDocument();
      expect(screen.getByText('title')).toBeInTheDocument();

      // Click to collapse
      await user.click(screen.getByText('Collapse details'));

      // Should be collapsed
      expect(screen.getByText('Expand details')).toBeInTheDocument();
      expect(screen.queryByText('title')).not.toBeInTheDocument();

      // Click to expand again
      await user.click(screen.getByText('Expand details'));

      // Should be expanded again
      expect(screen.getByText('Collapse details')).toBeInTheDocument();
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  describe('Timestamp and System Field Management', () => {
    it('should auto-update system-managed timestamp fields', async () => {
      const user = userEvent.setup();
      const conflict = createBasicConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Navigate through manual merge flow
      await user.click(screen.getByDisplayValue('manual'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Apply Merge'));

      // Should call onResolve with auto-updated timestamp
      expect(mockOnResolve).toHaveBeenCalledWith(
        'manual',
        expect.objectContaining({
          timestamp: expect.any(Number),
        })
      );

      // The timestamp should be recent (within last few seconds)
      const call = mockOnResolve.mock.calls[0][1];
      const timeDiff = Date.now() - call.timestamp;
      expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
    });

    it('should preserve creation timestamps', async () => {
      const user = userEvent.setup();
      const baseConflict = createBasicConflict();
      const conflictWithCreatedAt: SyncConflict = {
        ...baseConflict,
        localVersion: {
          ...(baseConflict.localVersion as Record<string, unknown>),
          createdAt: 1609459200000, // Fixed creation time
        },
        serverVersion: {
          ...(baseConflict.serverVersion as Record<string, unknown>),
          createdAt: 1609459200000, // Same creation time
        },
      };

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflictWithCreatedAt}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Navigate through manual merge flow
      await user.click(screen.getByDisplayValue('manual'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Apply Merge'));

      // Should preserve the original creation time
      expect(mockOnResolve).toHaveBeenCalledWith(
        'manual',
        expect.objectContaining({
          createdAt: 1609459200000,
        })
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle conflicts without enhanced details', () => {
      const basicConflict = createBasicConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={basicConflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Should still render without errors
      expect(screen.getByText('Changes Overview')).toBeInTheDocument();
      // Should not show enhanced conflict count
      expect(screen.queryByText(/field.*conflicted/)).not.toBeInTheDocument();
    });

    it('should handle empty or undefined field values', async () => {
      const user = userEvent.setup();
      const conflictWithUndefined: SyncConflict = {
        ...createBasicConflict(),
        localVersion: {
          id: 'trip-123',
          title: 'Local Title',
          description: undefined,
        },
        serverVersion: {
          id: 'trip-123',
          title: 'Server Title',
          description: 'Server description',
        },
      };

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflictWithUndefined}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Should handle undefined values without errors
      await user.click(screen.getByDisplayValue('manual'));
      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Field Selection')).toBeInTheDocument();
    });
  });

  describe('Nested Field Selection', () => {
    it('should allow selecting individual nested field values', async () => {
      const user = userEvent.setup();
      const conflict = createEnhancedNestedConflict();

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={conflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to merge step
      await user.click(screen.getByDisplayValue('manual'));
      await user.click(screen.getByText('Next'));

      // Should show the nested field with full path
      expect(screen.getByText('days.1.items.0.packed')).toBeInTheDocument();

      // Should show "Nested" badge
      expect(screen.getByText('Nested')).toBeInTheDocument();

      // Should show conflicted badge
      expect(screen.getByText('Conflicted')).toBeInTheDocument();

      // Should show local value (false) and server value (true)
      const localRadio = screen.getByDisplayValue('local');
      const serverRadio = screen.getByDisplayValue('server');

      expect(localRadio).toBeInTheDocument();
      expect(serverRadio).toBeInTheDocument();
      expect(serverRadio).toBeChecked(); // Server should be selected by default

      // Should show the actual values
      expect(screen.getByText('false')).toBeInTheDocument(); // Local value
      expect(screen.getByText('true')).toBeInTheDocument(); // Server value

      // Select local value instead
      await user.click(localRadio);
      expect(localRadio).toBeChecked();

      // Navigate to preview
      await user.click(screen.getByText('Next'));

      // Should show final merged object
      expect(screen.getByText('Final Merged Object')).toBeInTheDocument();

      // Apply the merge
      await user.click(screen.getByText('Apply Merge'));

      // Should call onResolve with manual strategy and merged data
      expect(mockOnResolve).toHaveBeenCalledWith('manual', expect.any(Object));

      // The merged object should have the nested field set to the local value (false)
      const resolveCall = mockOnResolve.mock.calls[0];
      const mergedData = resolveCall[1];
      expect(mergedData.days[1].items[0].packed).toBe(false);
    });

    it('should handle multiple nested conflicts independently', async () => {
      const user = userEvent.setup();

      // Create a conflict with multiple nested field conflicts
      const multiNestedConflict: SyncConflict = {
        ...createEnhancedNestedConflict(),
        conflictDetails: {
          conflicts: [
            {
              path: 'days.0.items.0.packed',
              localValue: false,
              serverValue: true,
              type: 'modified',
            },
            {
              path: 'days.1.items.0.packed',
              localValue: false,
              serverValue: true,
              type: 'modified',
            },
          ],
          mergedObject: {
            id: 'trip-456',
            title: 'European Adventure',
            settings: { timezone: 'Europe/Paris' },
            days: [
              {
                date: '2024-03-01',
                location: 'Paris',
                items: [
                  { name: 'Passport', packed: false }, // Default to local
                  { name: 'Camera', packed: true },
                ],
              },
              {
                date: '2024-03-02',
                location: 'London',
                items: [
                  { name: 'Umbrella', packed: false }, // Default to local
                ],
              },
            ],
          },
        },
      };

      render(
        <ConflictResolutionModal
          isOpen={true}
          onClose={mockOnCancel}
          conflict={multiNestedConflict}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to merge step
      await user.click(screen.getByDisplayValue('manual'));
      await user.click(screen.getByText('Next'));

      // Should show both nested conflicts
      expect(screen.getByText('days.0.items.0.packed')).toBeInTheDocument();
      expect(screen.getByText('days.1.items.0.packed')).toBeInTheDocument();

      // Should show multiple "Nested" badges
      expect(screen.getAllByText('Nested')).toHaveLength(2);

      // Get all radio buttons
      const localRadios = screen.getAllByDisplayValue('local');
      const serverRadios = screen.getAllByDisplayValue('server');

      // Should have 2 local and 2 server radios for the nested fields
      expect(localRadios.length).toBeGreaterThanOrEqual(2);
      expect(serverRadios.length).toBeGreaterThanOrEqual(2);

      // Select different values for each nested field
      await user.click(localRadios[0]); // First nested field: local
      await user.click(serverRadios[1]); // Second nested field: server

      // Navigate to preview and apply
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Apply Merge'));

      // Should call onResolve with the correct nested values
      expect(mockOnResolve).toHaveBeenCalledWith('manual', expect.any(Object));

      const resolveCall = mockOnResolve.mock.calls[0];
      const mergedData = resolveCall[1];

      // First nested field should be local value (false)
      expect(mergedData.days[0].items[0].packed).toBe(false);
      // Second nested field should be server value (true)
      expect(mergedData.days[1].items[0].packed).toBe(true);
    });
  });
});
