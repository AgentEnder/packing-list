import { RulePack } from '@packing-list/model';

const SYSTEM_AUTHOR = {
  id: 'system',
  name: 'System',
};

const DEFAULT_METADATA = {
  created: new Date().toISOString(),
  modified: new Date().toISOString(),
  isBuiltIn: true,
  isShared: true,
  visibility: 'public',
  version: '1.0.0',
} as const;

const DEFAULT_STATS = {
  usageCount: 0,
  rating: 5,
  reviewCount: 0,
} as const;

export const DEFAULT_RULE_PACKS: RulePack[] = [
  {
    id: 'beach-essentials',
    name: 'Beach Essentials',
    description: 'Essential items for a beach vacation',
    primaryCategoryId: 'beach',
    author: SYSTEM_AUTHOR,
    metadata: {
      ...DEFAULT_METADATA,
      tags: ['beach', 'summer', 'vacation'],
      category: 'vacation',
    },
    stats: DEFAULT_STATS,
    icon: 'sun',
    color: '#FFB74D',
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
      {
        id: 'beach-hat',
        name: 'Sun Hat',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
        categoryId: 'accessories',
      },
      {
        id: 'beach-sunglasses',
        name: 'Sunglasses',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
        categoryId: 'accessories',
      },
      {
        id: 'beach-first-aid',
        name: 'First Aid Kit',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: false,
        },
        categoryId: 'medical',
      },
    ],
  },
  {
    id: 'business-travel',
    name: 'Business Travel',
    description: 'Essential items for business trips',
    primaryCategoryId: 'business',
    author: SYSTEM_AUTHOR,
    metadata: {
      ...DEFAULT_METADATA,
      tags: ['business', 'work', 'professional'],
      category: 'business',
    },
    stats: DEFAULT_STATS,
    icon: 'briefcase',
    color: '#78909C',
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
      {
        id: 'business-dress-shirts',
        name: 'Dress Shirts',
        calculation: {
          baseQuantity: 1,
          perDay: true,
          perPerson: true,
          daysPattern: {
            every: 2,
            roundUp: true,
          },
        },
        notes: 'One shirt for every two days',
        categoryId: 'clothing',
        subcategoryId: 'tops',
      },
      {
        id: 'business-dress-shoes',
        name: 'Dress Shoes',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
        categoryId: 'clothing',
        subcategoryId: 'footwear',
      },
      {
        id: 'business-toiletries',
        name: 'Travel Toiletries',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
        notes: 'Travel-sized toiletries',
        categoryId: 'toiletries',
      },
      {
        id: 'business-phone-charger',
        name: 'Phone & Charger',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
        categoryId: 'electronics',
      },
      {
        id: 'business-medications',
        name: 'Personal Medications',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
        notes: 'Remember any prescription medications',
        categoryId: 'medical',
      },
    ],
  },
];
