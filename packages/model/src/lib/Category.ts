export type Category = {
  id: string;
  name: string;
  icon?: string; // Optional icon identifier (e.g., from lucide-react)
  color?: string; // Optional color for UI display
  parentId?: string; // Optional parent category for hierarchical organization
};

// Built-in categories that are always available
export const BUILT_IN_CATEGORIES: Category[] = [
  { id: 'clothing', name: 'Clothing', icon: 'shirt' },
  { id: 'toiletries', name: 'Toiletries', icon: 'shower-head' },
  { id: 'electronics', name: 'Electronics', icon: 'smartphone' },
  { id: 'documents', name: 'Documents', icon: 'file-text' },
  { id: 'accessories', name: 'Accessories', icon: 'watch' },
  { id: 'gear', name: 'Gear', icon: 'backpack' },
  { id: 'medical', name: 'Medical', icon: 'first-aid' },
  { id: 'essentials', name: 'Essentials', icon: 'star' },
  { id: 'misc', name: 'Miscellaneous', icon: 'more-horizontal' },
];

// Clothing subcategories
export const CLOTHING_SUBCATEGORIES: Category[] = [
  { id: 'tops', name: 'Tops', parentId: 'clothing' },
  { id: 'bottoms', name: 'Bottoms', parentId: 'clothing' },
  { id: 'underwear', name: 'Underwear', parentId: 'clothing' },
  { id: 'outerwear', name: 'Outerwear', parentId: 'clothing' },
  { id: 'footwear', name: 'Footwear', parentId: 'clothing' },
  { id: 'swimwear', name: 'Swimwear', parentId: 'clothing' },
  { id: 'formal', name: 'Formal Wear', parentId: 'clothing' },
];

// Essentials subcategories
export const ESSENTIALS_SUBCATEGORIES: Category[] = [
  { id: 'sun-protection', name: 'Sun Protection', parentId: 'essentials' },
];

// Helper function to get all available categories
export function getAllCategories(): Category[] {
  return [
    ...BUILT_IN_CATEGORIES,
    ...CLOTHING_SUBCATEGORIES,
    ...ESSENTIALS_SUBCATEGORIES,
  ];
}

// Helper function to get subcategories for a given category
export function getSubcategories(categoryId: string): Category[] {
  return getAllCategories().filter((cat) => cat.parentId === categoryId);
}
