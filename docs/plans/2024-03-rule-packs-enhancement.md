# Rule Packs Enhancement Plan

## Overview

Currently, the packing list app has a limited set of predefined rule packs. This plan outlines the necessary changes to support user-created rule packs, sharing capabilities, and improved discovery features.

## Goals

1. Enable users to create and manage custom rule packs
2. Improve rule pack discovery and organization
3. Prepare the UI/UX for future sharing capabilities
4. Make rule packs more flexible and reusable
5. Scale the UI to handle many rule packs effectively

## UI/UX Changes

### Immediate Display Improvements

- Replace current fixed-column grid with a responsive layout
  - Use CSS Grid with auto-fit/auto-fill for dynamic columns
  - Maintain consistent card sizes across different screen sizes
  - Add proper spacing and padding for dense layouts
- Improve rule pack cards
  - Add compact mode for dense lists
  - Show rule count and category badges
  - Add hover states with quick actions
  - Implement proper text truncation
- Add basic filtering and organization
  - Simple category dropdown
  - Text search input
  - Sort by name/category
- Implement infinite scroll or pagination
  - Virtual scrolling for large lists
  - Lazy loading of rule details
  - Loading states and placeholders
- Improve selection UX
  - Multi-select capability
  - Bulk actions (apply/remove)
  - Clear visual feedback for selected state

### Rule Packs List View

- Add a search bar for filtering rule packs
- Implement tags/categories for rule packs
- Add sorting options (e.g., by name, recently used, popularity)
- Show preview of rules in each pack
- Add indicators for:
  - Custom vs. built-in packs
  - Shared packs (future)
  - Pack author/source
  - Usage count

### Rule Pack Creation/Edit

- New "Create Rule Pack" button in prominent location
- Rule pack edit form with:
  - Name and description
  - Category/tags selection
  - Icon or color selection
  - Visibility settings (private/public - for future use)
  - Rule list management
    - Add/remove rules
    - Reorder rules
    - Rule conditions and quantities
    - Rule dependencies
    - Import from existing rules:
      - Browse and select from default rules
      - Filter by category/type
      - Quick search within existing rules
      - Bulk selection of rules
      - Option to customize imported rules
- Preview mode to see how rules will apply

### Rule Pack Details View

- Detailed view showing:
  - Full description and metadata
  - Complete list of rules
  - Usage statistics (future)
  - Share button (future)
  - Export/Import functionality
  - Version history (future)
- Actions:
  - Edit pack
  - Duplicate pack
  - Delete pack
  - Apply to trip

### Rule Management

- Improved rule creation interface
  - More condition types
  - Better quantity controls
  - Dependencies between rules
- Rule templates or patterns
- Rule validation and testing tools
- Bulk rule operations

## Data Structure Changes

### Rule Pack Model

```typescript
interface RulePack {
  id: string;
  name: string;
  description: string;
  author: {
    id: string;
    name: string;
  };
  metadata: {
    created: Date;
    modified: Date;
    isBuiltIn: boolean;
    isShared: boolean;
    visibility: 'private' | 'public';
    tags: string[];
    category: string;
    version: string;
  };
  stats: {
    usageCount: number;
    rating: number;
    reviewCount: number;
  };
  rules: PackingRule[];
  icon?: string;
  color?: string;
}

interface PackingRule {
  id: string;
  name: string;
  description?: string;
  conditions: RuleCondition[];
  quantities: RuleQuantity[];
  dependencies?: string[]; // IDs of other rules
  metadata?: {
    tags?: string[];
    category?: string;
  };
}
```

## Implementation Phases

### Phase 1: UI Foundation

1. Improve current rule packs display
   - Implement responsive grid layout
   - Add compact card design
   - Basic filtering and sorting
   - Pagination or infinite scroll
2. Create new rule packs list view
   - Implement basic search and filtering
   - Add create/edit buttons
   - Show expanded rule pack information
3. Build rule pack creation/edit form
   - Basic metadata editing
   - Rule management interface
4. Implement rule pack details view
   - Show all pack information
   - Enable basic actions (edit, duplicate, delete)

### Phase 2: Enhanced Rule Management

1. Improve rule creation interface
   - Add more condition types
   - Implement quantity controls
   - Add rule dependencies
2. Add rule templates
3. Implement rule validation
4. Add bulk operations

### Phase 3: Organization & Discovery

1. Implement tagging system
2. Add categories
3. Improve search functionality
4. Add sorting options
5. Implement preview features

### Phase 4: Future-Proofing

1. Add placeholder UI for sharing
2. Prepare export/import functionality
3. Add version tracking UI
4. Implement statistics tracking

## Technical Considerations

### State Management

- Create new Redux slices for:
  - Rule pack management
  - Rule templates
  - User preferences
- Implement optimistic updates
- Add undo/redo support

### Performance

- Implement virtualization for large rule lists
- Use memoization for rule calculations
- Lazy load rule pack details
- Cache frequently used packs
- Optimize rule pack card rendering
  - Use CSS containment
  - Implement proper will-change hints
  - Optimize animations and transitions
  - Defer loading of non-critical content

### Testing

- Unit tests for rule logic
- Integration tests for pack management
- E2E tests for critical flows
- Performance testing for large rule sets

## Future Considerations

### Sharing & Collaboration

- User accounts
- Pack sharing mechanisms
- Collaborative editing
- Version control
- Comments and ratings

### Advanced Features

- Rule pack composition (combining packs)
- Conditional pack application
- AI-assisted rule creation
- Pack recommendations
- Usage analytics

## Success Metrics

- Number of custom rule packs created
- Rule pack usage statistics
- User engagement with pack creation
- Search and discovery effectiveness
- UI performance metrics

## Next Steps

1. Review and refine this plan
2. Create detailed UI mockups
3. Break down implementation into tasks
4. Prioritize features for initial release
5. Begin Phase 1 implementation

## ASCII Mockups

### Responsive Rule Packs Grid

```
┌─ Rule Packs ──────────────────────────────────────────────────────┐
│ ┌─Search─────────┐ [Category ▼] [Sort By ▼]    [+ Create Pack]    │
│ └────────────────┘                                                │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│ │Beach Trip   │ │Camping      │ │Winter Trip  │ │Custom Pack  │  │
│ │[Built-in]   │ │[Built-in]   │ │[Built-in]   │ │[Custom]     │  │
│ │             │ │             │ │             │ │             │  │
│ │12 Rules     │ │15 Rules     │ │18 Rules     │ │8 Rules      │  │
│ │Beach,Summer │ │Outdoor      │ │Winter,Snow  │ │Travel       │  │
│ │[Apply] [↗]  │ │[Apply] [↗]  │ │[Apply] [↗]  │ │[Apply] [↗]  │  │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│                                                                   │
│ ┌─────────────┐ ┌─────────────┐      ┌─ Loading ──┐              │
│ │Business     │ │Festival     │      │            │              │
│ │[Shared]     │ │[Custom]     │      │   ⟳        │              │
│ │             │ │             │      │            │              │
│ │10 Rules     │ │6 Rules      │      └────────────┘              │
│ │Work,Travel  │ │Music,Summer │                                  │
│ │[Apply] [↗]  │ │[Apply] [↗]  │                                  │
│ └─────────────┘ └─────────────┘                                  │
└───────────────────────────────────────────────────────────────────┘
```

### Rule Pack Details View

```
┌─ Beach Trip Pack ────────────────────────────────────────────────┐
│ [← Back]                                     [Share] [Edit] [...] │
│ ┌─Description──────────────────────────────────────────────────┐ │
│ │Essential items for a perfect beach vacation. Includes sun    │ │
│ │protection, beach gear, and evening wear.                     │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Rules (12)          [+ Add Rule]          [Bulk Edit] [Preview] │
│ ┌─Rules List─────────────────────────────────────────────────┐  │
│ │ ☼ Sunscreen                                                │  │
│ │   └─ 1 bottle per person per week                          │  │
│ │   └─ If sunny days > 2                                     │  │
│ │                                                            │  │
│ │ ⌂ Beach Umbrella                                          │  │
│ │   └─ 1 per group                                          │  │
│ │   └─ If beach days > 0                                    │  │
│ │                                                            │  │
│ │ ⚑ Beach Towels                                            │  │
│ │   └─ 2 per person                                         │  │
│ │   └─ If beach days > 0                                    │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│ Metadata                                                        │
│ ├─ Category: Beach, Summer                                      │
│ ├─ Created: 2024-03-20                                         │
│ ├─ Last Modified: 2024-03-21                                    │
│ └─ Used: 42 times                                              │
└──────────────────────────────────────────────────────────────────┘
```

### Rule Pack Creation/Edit

```
┌─ Create Rule Pack ───────────────────────────────────────────────┐
│ ┌─Basic Info────────────────────────────────────────────────┐    │
│ │ Name: [________________________]                          │    │
│ │ Description:                                              │    │
│ │ [________________________________________________]       │    │
│ │ Category: [Select ▼]  Tags: [Add tags...]                │    │
│ └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│ ┌─Rules──────────────────────────────────────────────────┐      │
│ │ [+ Add Rule] [Import] [Templates ▼] [Browse Existing ▼] │      │
│ │                                                         │      │
│ │ ┌─Existing Rules─────────────────────────────────┐     │      │
│ │ │ [🔍 Search rules...]  [Category ▼]             │     │      │
│ │ │ ☐ Toiletries                                   │     │      │
│ │ │   ☑ Toothbrush (1 per person)                 │     │      │
│ │ │   ☑ Toothpaste (1 per group)                  │     │      │
│ │ │   ☐ Shampoo (1 per week)                      │     │      │
│ │ │ ☐ Clothing                                     │     │      │
│ │ │   ☑ Socks (1 per day)                         │     │      │
│ │ │   ☐ Underwear (1 per day + 1)                 │     │      │
│ │ │ [Import Selected (4)]                          │     │      │
│ │ └───────────────────────────────────────────────┘     │      │
│ │                                                         │      │
│ │ ┌─Selected Rules────────────────────────────────┐      │      │
│ │ │ 1. Toothbrush                                 │ [Edit] │    │
│ │ │    1 per person                               │ [↕]   │    │
│ │ │                                               │ [×]   │    │
│ │ │ 2. Toothpaste                                │ [Edit] │    │
│ │ │    1 per group                               │ [↕]   │    │
│ │ │                                               │ [×]   │    │
│ │ │ 3. Socks                                     │ [Edit] │    │
│ │ │    1 per day                                 │ [↕]   │    │
│ │ │                                               │ [×]   │    │
│ │ └───────────────────────────────────────────────┘      │      │
│ └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│ ┌─Preview────────────────────────────────────────────────┐      │
│ │ Sample Trip:                                           │      │
│ │ - 3 days                                              │      │
│ │ - 2 people                                            │      │
│ │                                                       │      │
│ │ Generated Items:                                      │      │
│ │ ✓ 2 Toothbrushes (1 per person)                      │      │
│ │ ✓ 1 Toothpaste (1 per group)                         │      │
│ │ ✓ 6 Pairs of Socks (1 per person per day)            │      │
│ └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│ [Cancel]                                           [Save Pack]   │
└──────────────────────────────────────────────────────────────────┘
```

### Compact List View (Mobile)

```
┌─Rule Packs───────────────┐
│ [🔍] [Filter ▼] [Sort ▼] │
│                          │
│ ┌─Beach Trip──────────┐  │
│ │[Built-in] 12 Rules  │  │
│ │Beach, Summer        │  │
│ │[Apply]          [↗] │  │
│ └────────────────────┘  │
│                         │
│ ┌─Camping────────────┐  │
│ │[Built-in] 15 Rules │  │
│ │Outdoor             │  │
│ │[Apply]          [↗] │  │
│ └────────────────────┘  │
│                         │
│ ┌─Winter Trip────────┐  │
│ │[Built-in] 18 Rules │  │
│ │Winter, Snow        │  │
│ │[Apply]          [↗] │  │
│ └────────────────────┘  │
│                         │
│     [Load More...]      │
└─────────────────────────┘
```
