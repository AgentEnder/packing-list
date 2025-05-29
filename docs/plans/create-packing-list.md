# Packing List Implementation Plan

## Overview

This plan outlines the implementation of the core packing list functionality, including the ability to view items by day or by person, override rules, and lay groundwork for future bag/suitcase organization features.

## Implementation Steps

### Commit 1: Redux State and Model Enhancement

- Add new state slices for packing list view preferences and rule overrides
- Extend the trip model with:

  ```typescript
  interface RuleOverride {
    ruleId: string;
    tripId: string;
    personId?: string; // If null, applies to all people
    dayIndex?: number; // If null, applies to all days
    overrideCount?: number;
    isExcluded: boolean;
  }

  interface PackingListViewState {
    viewMode: 'by-day' | 'by-person';
    selectedDayIndex?: number;
    selectedPersonId?: string;
    filters: {
      packed: boolean;
      unpacked: boolean;
      excluded: boolean;
    };
  }
  ```

- Add Redux actions and reducers for:
  - Toggling view modes
  - Managing rule overrides
  - Filtering and sorting options

### Commit 2: Core UI Components

- Create PackingList container component with:
  - ViewToggle component (Day/Person view switcher)
  - FilterBar component (packed/unpacked/excluded filters)
  - DayView and PersonView components
- Implement item grouping logic:
  ```typescript
  interface PackingListItem {
    id: string;
    name: string;
    count: number;
    ruleId: string;
    isPacked: boolean;
    isOverridden: boolean;
    applicableDays: number[];
    applicablePersons: string[];
  }
  ```
- Add basic styling and layout using shadcn components

### Commit 3: Rule Override System

- Create RuleOverrideDialog component for modifying rule applications
- Implement override management UI with:
  - Person/day selection
  - Count adjustment
  - Exclusion toggle
- Add visual indicators for overridden items
- Implement override persistence and state management

## Future Considerations

- Bag/suitcase assignment system
- Packing list export/sharing
- Multi-trip template support
- Mobile-optimized views
- Collaborative packing features

## Technical Notes

- Use React.memo for optimizing list rendering performance
- Implement virtual scrolling for large packing lists
- Consider offline support via localStorage sync
- Add comprehensive logging for override actions
