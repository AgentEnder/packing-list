import { RulePack } from '@packing-list/model';

export const DEFAULT_RULE_PACKS: RulePack[] = [
  {
    id: 'beach-essentials',
    name: 'Beach Essentials',
    description: 'Essential items for a beach vacation',
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
      {
        id: 'beach-towel',
        name: 'Beach Towel',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
      },
      {
        id: 'beach-sandals',
        name: 'Sandals/Flip-flops',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
      },
    ],
  },
  {
    id: 'business-travel',
    name: 'Business Travel',
    description: 'Professional attire and business essentials',
    rules: [
      {
        id: 'business-suit',
        name: 'Business Suit',
        calculation: {
          baseQuantity: 1,
          perDay: true,
          perPerson: true,
          daysPattern: {
            every: 2,
            roundUp: true,
          },
        },
        notes: 'One suit for every two days',
      },
      {
        id: 'business-shirt',
        name: 'Dress Shirt',
        calculation: {
          baseQuantity: 1,
          perDay: true,
          perPerson: true,
        },
        notes: 'One fresh shirt per day',
      },
      {
        id: 'business-shoes',
        name: 'Dress Shoes',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
      },
      {
        id: 'business-laptop',
        name: 'Laptop & Charger',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
      },
    ],
  },
  {
    id: 'winter-gear',
    name: 'Winter Gear',
    description: 'Cold weather essentials',
    rules: [
      {
        id: 'winter-coat',
        name: 'Winter Coat',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
      },
      {
        id: 'winter-gloves',
        name: 'Gloves',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
      },
      {
        id: 'winter-hat',
        name: 'Winter Hat',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
      },
      {
        id: 'winter-boots',
        name: 'Winter Boots',
        calculation: {
          baseQuantity: 1,
          perDay: false,
          perPerson: true,
        },
      },
      {
        id: 'winter-thermals',
        name: 'Thermal Underwear',
        calculation: {
          baseQuantity: 2,
          perDay: false,
          perPerson: true,
        },
        notes: 'Two sets per person',
      },
    ],
  },
];
