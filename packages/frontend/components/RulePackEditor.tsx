import { useState } from 'react';
import { RulePack, DefaultItemRule } from '@packing-list/model';
import { useAppDispatch } from '@packing-list/state';
import { showToast } from './Toast';
import {
  Sun,
  Briefcase,
  Tent,
  Backpack,
  Plane,
  Car,
  Train,
  Ship,
  Map,
  Compass,
} from 'lucide-react';
import { RulePackRuleSelector } from './RulePackRuleSelector';

interface RulePackEditorProps {
  pack?: RulePack; // If provided, we're editing an existing pack
  onSave?: () => void;
  onCancel?: () => void;
}

const AVAILABLE_COLORS = [
  '#FFB74D', // Orange
  '#78909C', // Blue Grey
  '#4CAF50', // Green
  '#F44336', // Red
  '#9C27B0', // Purple
  '#2196F3', // Blue
  '#FFEB3B', // Yellow
  '#795548', // Brown
  '#607D8B', // Grey
  '#E91E63', // Pink
];

const ICONS = {
  sun: Sun,
  briefcase: Briefcase,
  tent: Tent,
  backpack: Backpack,
  plane: Plane,
  car: Car,
  train: Train,
  ship: Ship,
  map: Map,
  compass: Compass,
} as const;

const AVAILABLE_ICONS = [
  'sun',
  'briefcase',
  'tent',
  'backpack',
  'plane',
  'car',
  'train',
  'ship',
  'map',
  'compass',
] as const;

const CATEGORIES = [
  'vacation',
  'business',
  'outdoor',
  'sports',
  'family',
  'other',
] as const;

const DEFAULT_AUTHOR = {
  id: 'user',
  name: 'User',
};

const DEFAULT_METADATA = {
  created: new Date().toISOString(),
  modified: new Date().toISOString(),
  isBuiltIn: false,
  isShared: false,
  visibility: 'private' as const,
  tags: [],
  category: 'other' as const,
  version: '1.0.0',
};

const DEFAULT_STATS = {
  usageCount: 0,
  rating: 5,
  reviewCount: 0,
};

export function RulePackEditor({
  pack,
  onSave,
  onCancel,
}: RulePackEditorProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(pack?.name ?? '');
  const [description, setDescription] = useState(pack?.description ?? '');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>(
    (pack?.metadata?.category as typeof CATEGORIES[number]) ?? 'other'
  );
  const [tags, setTags] = useState<string[]>(pack?.metadata?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(
    pack?.color ?? AVAILABLE_COLORS[0]
  );
  const [selectedIcon, setSelectedIcon] = useState<
    typeof AVAILABLE_ICONS[number]
  >((pack?.icon as typeof AVAILABLE_ICONS[number]) ?? 'sun');
  const [visibility, setVisibility] = useState(
    pack?.metadata?.visibility ?? 'private'
  );
  const [selectedRules, setSelectedRules] = useState<DefaultItemRule[]>(
    pack?.rules ?? []
  );

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast('Please enter a name for the rule pack');
      return;
    }

    if (!selectedRules.length) {
      showToast('Please add at least one rule to the pack');
      return;
    }

    const newPack: RulePack = {
      id: pack?.id ?? `pack-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      author: pack?.author ?? DEFAULT_AUTHOR,
      metadata: {
        created: pack?.metadata?.created ?? DEFAULT_METADATA.created,
        modified: new Date().toISOString(),
        isBuiltIn: pack?.metadata?.isBuiltIn ?? DEFAULT_METADATA.isBuiltIn,
        isShared: pack?.metadata?.isShared ?? DEFAULT_METADATA.isShared,
        visibility,
        tags,
        category,
        version: pack?.metadata?.version ?? DEFAULT_METADATA.version,
      },
      stats: pack?.stats ?? DEFAULT_STATS,
      rules: selectedRules,
      icon: selectedIcon,
      color: selectedColor,
    };

    dispatch({
      type: pack ? 'UPDATE_RULE_PACK' : 'CREATE_RULE_PACK',
      payload: newPack,
    });

    showToast(
      pack ? `Updated rule pack "${name}"` : `Created new rule pack "${name}"`
    );

    onSave?.();
  };

  return (
    <div className="space-y-6" data-testid="rule-pack-editor">
      <h2 className="text-2xl font-bold mb-6">
        {pack ? 'Edit Rule Pack' : 'Create New Rule Pack'}
      </h2>

      {/* Basic Info */}
      <div>
        <label className="label">Name</label>
        <input
          type="text"
          className="input input-bordered w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Pack name"
          data-testid="rule-pack-name-input"
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="textarea textarea-bordered w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Pack description"
          data-testid="rule-pack-description-input"
        />
      </div>

      {/* Category */}
      <div>
        <label className="label">Category</label>
        <select
          className="select select-bordered w-full"
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as typeof CATEGORIES[number])
          }
          data-testid="rule-pack-category-select"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Tags</span>
        </label>
        <div className="join">
          <input
            type="text"
            className="input input-bordered join-item"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="Add tag"
            data-testid="rule-pack-tag-input"
          />
          <button
            className="btn join-item"
            onClick={handleAddTag}
            data-testid="rule-pack-add-tag-button"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="badge badge-outline gap-2"
              data-testid={`rule-pack-tag-${tag}`}
            >
              {tag}
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => handleRemoveTag(tag)}
                data-testid={`rule-pack-remove-tag-${tag}-button`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Color</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_COLORS.map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded-full ${
                selectedColor === color ? 'ring-2 ring-primary' : ''
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
              data-testid={`rule-pack-color-${color}-button`}
            />
          ))}
        </div>
      </div>

      {/* Icon Selection */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">Icon</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_ICONS.map((icon) => {
            const IconComponent = ICONS[icon];
            return (
              <button
                key={icon}
                className={`btn btn-square btn-sm ${
                  selectedIcon === icon ? 'btn-primary' : 'btn-outline'
                }`}
                onClick={() => setSelectedIcon(icon)}
                data-testid={`rule-pack-icon-${icon}-button`}
              >
                <IconComponent className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Visibility */}
      <div className="form-control">
        <label className="label cursor-pointer">
          <span className="label-text">Visibility</span>
          <select
            className="select select-bordered"
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as 'private' | 'public')
            }
            data-testid="rule-pack-visibility-select"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </label>
      </div>

      {/* Rule Selection */}
      <div>
        <RulePackRuleSelector
          selectedRules={selectedRules}
          onRulesChange={setSelectedRules}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            className="btn"
            onClick={onCancel}
            data-testid="rule-pack-cancel-button"
          >
            Cancel
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={handleSave}
          data-testid="rule-pack-save-button"
        >
          {pack ? 'Update Pack' : 'Create Pack'}
        </button>
      </div>
    </div>
  );
}
