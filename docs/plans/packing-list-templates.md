# Default Item Rule Packs

## Overview

Allow users to save and load sets of default packing rules for different trip types (e.g., "Beach Essentials", "Business Travel", "Camping Gear"). These rule packs help ensure consistent and appropriate packing for specific types of trips.

## User Benefit

- Quick setup of appropriate packing rules for trip types
- Consistent packing across similar trips
- Share proven packing strategies with others
- Easily switch between different packing styles

## Technical Implementation

### Data Model Extensions

```typescript
interface DefaultItemRulePack {
  id: string;
  name: string;
  description: string;
  rules: DefaultItemRule[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Example rules in a "Beach Essentials" pack
const beachRules: DefaultItemRule[] = [
  {
    id: 'beach-swimsuit',
    name: 'Swimsuit',
    calculation: {
      baseQuantity: 2,
      perDay: false,
      perPerson: true,
    },
    notes: 'Pack an extra swimsuit for comfort',
  },
  {
    id: 'beach-sunscreen',
    name: 'Sunscreen',
    calculation: {
      baseQuantity: 1,
      perDay: false,
      perPerson: false,
      daysPattern: {
        every: 7,
        roundUp: true,
      },
    },
    notes: 'One bottle per week of trip',
  },
];
```

### State Management

- Add new slice to state store for rule pack management
- Add actions: CREATE_RULE_PACK, UPDATE_RULE_PACK, DELETE_RULE_PACK, APPLY_RULE_PACK
- Store rule packs in localStorage with key 'default-item-rule-packs'

### UI Components

1. Rule Pack Management Page (`/rule-packs`)

   - List of saved rule packs
   - Create/Edit rule pack form
   - Rule pack preview showing items it generates
   - Delete confirmation modal
   - Export/Import functionality

2. Rule Pack Selection

   - Quick-apply rule pack from trip settings
   - Merge multiple rule packs
   - Toggle individual rules within a pack

3. Rule Pack Sharing
   - Export rule pack as JSON
   - Import rule pack from JSON
   - Share via URL with preview

### Implementation Steps

1. Create rule pack data models
2. Add rule pack state management
3. Build rule pack management UI
4. Add rule pack preview functionality
5. Implement rule pack import/export
6. Add rule pack sharing via URL

### Testing Strategy

- Unit tests for rule calculations
- Integration tests for rule pack application
- E2E tests for rule pack management
- Validation tests for rule pack import/export

## Future Enhancements

- Community-shared rule packs
- Rule pack ratings and reviews
- Smart rule suggestions based on trip details
- Rule pack versioning
- Rule pack categories and search
- Rule conflict detection and resolution
- Rule pack combination recommendations
