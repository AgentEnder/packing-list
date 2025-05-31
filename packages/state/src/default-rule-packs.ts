import { RulePack } from '@packing-list/model';

export const DEFAULT_RULE_PACKS: RulePack[] = [
  {
    id: 'beach-essentials',
    name: 'Beach Essentials',
    description: 'Essential items for a beach vacation',
    primaryCategoryId: 'beach',
    rules: [
      {
        id: 'beach-swimsuit',
        name: 'Swimsuit',
        calculation: {
          baseQuantity: 2,
          perDay: false,
          perPerson: true,
        },
        notes: 'Pack an extra swimsuit for comfort',
        categoryId: 'clothing',
        subcategoryId: 'swimwear',
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
        categoryId: 'toiletries',
      },
      {
        id: 'beach-towel',
        name: 'Beach Towel',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
        categoryId: 'gear',
      },
      {
        id: 'beach-sandals',
        name: 'Sandals/Flip-flops',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
        categoryId: 'clothing',
        subcategoryId: 'footwear',
      },
    ],
  },
  {
    id: 'business-travel',
    name: 'Business Travel',
    description: 'Essential items for business trips',
    primaryCategoryId: 'business',
    rules: [
      {
        id: 'business-suit',
        name: 'Business Suit',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
        notes: 'One formal suit per person',
        categoryId: 'clothing',
        subcategoryId: 'formal',
      },
      {
        id: 'business-laptop',
        name: 'Laptop & Charger',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
        categoryId: 'electronics',
      },
      {
        id: 'business-documents',
        name: 'Business Documents',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
        categoryId: 'documents',
      },
    ],
  },
];
