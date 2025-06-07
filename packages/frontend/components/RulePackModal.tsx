import { useEffect, useState } from 'react';
import { RulePack } from '@packing-list/model';
import { useAppDispatch, useAppSelector } from '@packing-list/state';
import { Modal } from '@packing-list/shared-components';
import { showToast } from './Toast';
import { RulePackEditor } from './RulePackEditor';
import { RulePackDetails } from './RulePackDetails';
import {
  Check,
  Star,
  Users,
  Tag,
  Calendar,
  Plus,
  X,
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
  User,
} from 'lucide-react';

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

export function RulePackModal() {
  const [editingPack, setEditingPack] = useState<RulePack | undefined>();
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const dispatch = useAppDispatch();
  const rulePacks = useAppSelector((state) => state.rulePacks);
  const currentRules = useAppSelector((state) => state.defaultItemRules);
  const rulePackModal = useAppSelector((state) => state.ui.rulePackModal);
  const activeTab = rulePackModal.activeTab;
  const selectedPackId = rulePackModal.selectedPackId;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const selectedPack = selectedPackId
    ? rulePacks.find((pack) => pack.id === selectedPackId)
    : undefined;

  const isPackActive = (pack: RulePack): boolean => {
    return currentRules.some((rule) => rule.packIds?.includes(pack.id));
  };

  const handleTogglePack = (pack: RulePack) => {
    const active = isPackActive(pack);
    dispatch({
      type: 'TOGGLE_RULE_PACK',
      pack,
      active: !active,
    });
    showToast(
      active ? `Removed "${pack.name}" rules` : `Added "${pack.name}" rules`
    );
  };

  const handleDeletePack = (pack: RulePack) => {
    dispatch({
      type: 'DELETE_RULE_PACK',
      payload: { id: pack.id },
    });
    showToast(`Deleted "${pack.name}"`);
  };

  const handleExportPack = (pack: RulePack) => {
    const exportData = JSON.stringify(pack, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pack.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported "${pack.name}"`);
  };

  const getPackIcon = (pack: RulePack) => {
    if (!pack.icon) return null;
    const IconComponent = ICONS[pack.icon as keyof typeof ICONS];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
  };

  const filteredPacks = rulePacks.filter(
    (pack) =>
      pack.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!selectedCategory || pack.metadata.category === selectedCategory) &&
      (selectedTags.size === 0 ||
        [...selectedTags].some((tag) => pack.metadata.tags.includes(tag)))
  );

  // Get all unique tags
  const allTags = [...new Set(rulePacks.flatMap((pack) => pack.metadata.tags))];

  const handleToggleTag = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const handleCreatePack = () => {
    setEditingPack(undefined);
    dispatch({ type: 'SET_RULE_PACK_MODAL_TAB', payload: { tab: 'manage' } });
  };

  const handleEditPack = (pack: RulePack) => {
    setEditingPack(pack);
    dispatch({ type: 'SET_RULE_PACK_MODAL_TAB', payload: { tab: 'manage' } });
  };

  const handleViewDetails = (pack: RulePack) => {
    dispatch({
      type: 'SET_RULE_PACK_MODAL_TAB',
      payload: { tab: 'details', packId: pack.id },
    });
  };

  const handleSavePack = () => {
    setEditingPack(undefined);
    dispatch({ type: 'SET_RULE_PACK_MODAL_TAB', payload: { tab: 'browse' } });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const jsonData = event.target?.result;
        if (typeof jsonData === 'string') {
          const pack = JSON.parse(jsonData);
          dispatch({
            type: 'CREATE_RULE_PACK',
            payload: pack,
          });
          showToast(`Imported "${pack.name}"`);
        }
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    const exitListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch({ type: 'CLOSE_RULE_PACK_MODAL' });
      }
    };
    window.addEventListener('keydown', exitListener);
    return () => window.removeEventListener('keydown', exitListener);
  }, []);

  if (!rulePackModal.isOpen) return null;

  return (
    <Modal
      isOpen={rulePackModal.isOpen}
      onClose={() => dispatch({ type: 'CLOSE_RULE_PACK_MODAL' })}
      title="Rule Packs"
      size="full"
      zIndex="z-[10000]"
      modalBoxClassName="my-0 sm:my-8 max-h-[calc(100vh-4rem)] overflow-y-auto"
      data-testid="rule-pack-modal"
    >
      <div className="tabs tabs-boxed mb-6">
        <button
          className={`tab ${activeTab === 'browse' ? 'tab-active' : ''}`}
          onClick={() =>
            dispatch({
              type: 'SET_RULE_PACK_MODAL_TAB',
              payload: { tab: 'browse' },
            })
          }
          data-testid="browse-tab"
        >
          Browse Packs
        </button>
        <button
          className={`tab ${activeTab === 'manage' ? 'tab-active' : ''}`}
          onClick={() =>
            dispatch({
              type: 'SET_RULE_PACK_MODAL_TAB',
              payload: { tab: 'manage' },
            })
          }
          data-testid="manage-tab"
        >
          {editingPack ? 'Edit Pack' : 'Create Pack'}
        </button>
        {activeTab === 'details' && (
          <button className="tab tab-active" data-testid="details-tab">
            Pack Details
          </button>
        )}
      </div>

      {activeTab === 'browse' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search packs..."
              className="input input-bordered flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="pack-search-input"
            />
            <select
              className="select select-bordered"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              data-testid="pack-category-select"
            >
              <option value="">All Categories</option>
              <option value="vacation">Vacation</option>
              <option value="business">Business</option>
              <option value="outdoor">Outdoor</option>
              <option value="sports">Sports</option>
              <option value="family">Family</option>
              <option value="other">Other</option>
            </select>
            <button
              className="btn btn-primary"
              onClick={handleCreatePack}
              data-testid="create-pack-button"
            >
              <Plus className="w-4 h-4" />
              Create Pack
            </button>
            <input
              type="file"
              accept=".json"
              className="hidden"
              id="import-file-input"
              onChange={handleImportFile}
            />
            <button
              className="btn btn-ghost"
              onClick={() =>
                document.getElementById('import-file-input')?.click()
              }
              data-testid="import-pack-button"
            >
              Import Pack
            </button>
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">Filter by tags:</div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    className={`btn btn-sm ${
                      selectedTags.has(tag) ? 'btn-primary' : 'btn-outline'
                    }`}
                    onClick={() => handleToggleTag(tag)}
                    data-testid={`filter-tag-${tag}-button`}
                  >
                    {tag}
                  </button>
                ))}
                {selectedTags.size > 0 && (
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setSelectedTags(new Set())}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPacks.map((pack) => {
              const active = isPackActive(pack);
              const icon = getPackIcon(pack);

              return (
                <div
                  key={pack.id}
                  className={`card bg-base-100 shadow-xl ${
                    active ? 'border-2 border-primary' : ''
                  } cursor-pointer hover:bg-base-200 transition-colors`}
                  style={{
                    borderColor: active ? undefined : pack.color,
                    borderWidth: '1px',
                  }}
                  onClick={() => handleViewDetails(pack)}
                  data-testid={`pack-${pack.name}`}
                >
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="card-title flex items-center gap-2">
                          {icon}
                          {pack.name}
                          {active && <Check className="w-4 h-4 text-primary" />}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-base-content/70">
                        <Star className="w-4 h-4" />
                        <span>{pack.stats.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <p className="text-base-content/70 text-sm line-clamp-2">
                      {pack.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {pack.metadata.tags.map((tag) => (
                        <span
                          key={tag}
                          className="badge badge-sm badge-outline"
                          style={{ borderColor: pack.color }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm text-base-content/70">
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        <span>{pack.rules.length} rules</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{pack.stats.usageCount} uses</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{pack.author.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(
                            pack.metadata.modified
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div
                      className="card-actions justify-end mt-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!pack.metadata.isBuiltIn && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleEditPack(pack)}
                          data-testid={`edit-pack-${pack.name}-button`}
                        >
                          Edit
                        </button>
                      )}
                      {!pack.metadata.isBuiltIn && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleExportPack(pack)}
                          data-testid={`export-pack-${pack.name}-button`}
                        >
                          Export
                        </button>
                      )}
                      {!pack.metadata.isBuiltIn && (
                        <button
                          className="btn btn-ghost btn-sm btn-error"
                          onClick={() => handleDeletePack(pack)}
                          data-testid={`delete-pack-${pack.name}-button`}
                        >
                          Delete
                        </button>
                      )}
                      <button
                        className={`btn btn-sm ${
                          active ? 'btn-outline btn-error' : 'btn-primary'
                        }`}
                        onClick={() => handleTogglePack(pack)}
                        data-testid={`${active ? 'remove' : 'apply'}-pack-${
                          pack.name
                        }-button`}
                      >
                        {active ? 'Remove' : 'Add Rules'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'manage' && (
        <RulePackEditor
          pack={editingPack}
          onSave={handleSavePack}
          onCancel={() =>
            dispatch({
              type: 'SET_RULE_PACK_MODAL_TAB',
              payload: { tab: 'browse' },
            })
          }
        />
      )}

      {activeTab === 'details' && selectedPack && (
        <RulePackDetails pack={selectedPack} />
      )}
    </Modal>
  );
}
