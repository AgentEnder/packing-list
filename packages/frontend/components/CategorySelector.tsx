import {
  Category,
  getAllCategories,
  getSubcategories,
} from '@packing-list/model';
import { useState, useEffect } from 'react';

interface CategorySelectorProps {
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
  onCategoryChange: (categoryId?: string, subcategoryId?: string) => void;
  className?: string;
  testIdPrefix?: string;
}

export function CategorySelector({
  selectedCategoryId,
  selectedSubcategoryId,
  onCategoryChange,
  className = '',
  testIdPrefix = '',
}: CategorySelectorProps) {
  const [categories] = useState<Category[]>(getAllCategories());
  const [subcategories, setSubcategories] = useState<Category[]>([]);

  useEffect(() => {
    if (selectedCategoryId) {
      setSubcategories(getSubcategories(selectedCategoryId));
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Category</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={selectedCategoryId}
          onChange={(e) => {
            const newCategoryId = e.target.value;
            onCategoryChange(newCategoryId, undefined);
          }}
          data-testid={`${testIdPrefix}category-select`}
        >
          <option value="">Select a category</option>
          {categories
            .filter((cat: Category) => !cat.parentId) // Only show main categories in the first dropdown
            .map((category: Category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
      </div>

      {subcategories.length > 0 && (
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">
              Subcategory (Optional)
            </span>
          </label>
          <select
            className="select select-bordered w-full"
            value={selectedSubcategoryId || ''}
            onChange={(e) => {
              const newSubcategoryId = e.target.value || undefined;
              onCategoryChange(selectedCategoryId, newSubcategoryId);
            }}
            data-testid={`${testIdPrefix}subcategory-select`}
          >
            <option value="">No subcategory</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
