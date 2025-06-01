import { useState } from 'react';
import { RulePack } from '@packing-list/model';
import { useAppDispatch, useAppSelector } from '@packing-list/state';
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

  const getPackIcon = (pack: RulePack) => {
    if (!pack.icon) return null;
    const IconComponent = ICONS[pack.icon as keyof typeof ICONS];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
  };

  const filteredPacks = rulePacks.filter(
    (pack) =>
      pack.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (!selectedCategory || pack.metadata.category === selectedCategory)
  );

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

  if (!rulePackModal.isOpen) return null;

  return (
    <div className="modal modal-open z-[10000]">
      <div className="modal-box w-11/12 max-w-5xl my-0 sm:my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Rule Packs</h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => dispatch({ type: 'CLOSE_RULE_PACK_MODAL' })}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="tabs tabs-boxed mb-6">
          <button
            className={`tab ${activeTab === 'browse' ? 'tab-active' : ''}`}
            onClick={() =>
              dispatch({
                type: 'SET_RULE_PACK_MODAL_TAB',
                payload: { tab: 'browse' },
              })
            }
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
          >
            {editingPack ? 'Edit Pack' : 'Create Pack'}
          </button>
          {activeTab === 'details' && (
            <button className="tab tab-active">Pack Details</button>
          )}
        </div>

        {activeTab === 'browse' && (
          <>
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder="Search packs..."
                className="input input-bordered flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="select select-bordered w-48"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="vacation">Vacation</option>
                <option value="business">Business</option>
                <option value="outdoor">Outdoor</option>
                <option value="sports">Sports</option>
                <option value="family">Family</option>
              </select>
              <button className="btn btn-primary" onClick={handleCreatePack}>
                <Plus className="w-4 h-4 mr-2" />
                Create Pack
              </button>
            </div>

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
                  >
                    <div className="card-body">
                      <div className="flex items-start justify-between">
                        <h3 className="card-title flex items-center gap-2">
                          {icon}
                          {pack.name}
                          {active && <Check className="w-4 h-4 text-primary" />}
                        </h3>
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
                          >
                            Edit
                          </button>
                        )}
                        <button
                          className={`btn btn-sm ${
                            active ? 'btn-outline btn-error' : 'btn-primary'
                          }`}
                          onClick={() => handleTogglePack(pack)}
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
      </div>
    </div>
  );
}
