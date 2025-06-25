// Template Management Page - Sprint 3
// Allows users to manage their person templates

import { useState } from 'react';
import { UserPerson } from '@packing-list/model';
import {
  useAppSelector,
  useAppDispatch,
  selectUserTemplates,
  selectUserProfile,
  selectUserPeopleLoading,
  selectUserPeopleError,
} from '@packing-list/state';
import { PageHeader } from '../../../components/PageHeader';
import { PageContainer } from '../../../components/PageContainer';
import { HelpBlurb } from '../../../components/HelpBlurb';
import { User, Plus, Edit3, Trash2, Bookmark } from 'lucide-react';
import { TemplateForm } from './components/TemplateForm';

export default function PeopleManagePage() {
  const dispatch = useAppDispatch();
  const templates = useAppSelector(selectUserTemplates);
  const profile = useAppSelector(selectUserProfile);
  const isLoading = useAppSelector(selectUserPeopleLoading);
  const error = useAppSelector(selectUserPeopleError);

  const [editingTemplate, setEditingTemplate] = useState<UserPerson | null>(
    null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleDeleteTemplate = (template: UserPerson) => {
    if (confirm(`Delete template "${template.name}"? This cannot be undone.`)) {
      dispatch({
        type: 'DELETE_USER_PERSON',
        payload: { id: template.id },
      });
    }
  };

  const handleCreateTemplate = () => {
    setShowCreateForm(true);
    setEditingTemplate(null);
  };

  const handleEditTemplate = (template: UserPerson) => {
    setEditingTemplate(template);
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setShowCreateForm(false);
  };

  return (
    <PageContainer>
      <PageHeader title="Manage People Templates" />

      <HelpBlurb storageKey="templates" title="Person Templates">
        <p>
          Templates let you save frequently traveled-with people for quick reuse
          across multiple trips. Your profile and templates are private to you.
        </p>

        <h3 className="text-base mt-4 mb-2">Template Benefits</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Quickly add family members or frequent travel companions</li>
          <li>Consistent personal details across all trips</li>
          <li>No need to re-enter the same information</li>
          <li>Templates update independently from trip people</li>
        </ul>

        <div className="bg-base-200 rounded-lg p-4 my-4">
          <h3 className="text-sm font-medium mb-2">Profile vs Templates</h3>
          <p className="text-sm text-base-content/70 m-0">
            Your <strong>profile</strong> represents you and is automatically
            added to new trips.
            <br />
            <strong>Templates</strong> are for other people you travel with
            frequently.
          </p>
        </div>
      </HelpBlurb>

      {error && (
        <div className="alert alert-error mb-4">
          <span>Error loading templates: {error}</span>
        </div>
      )}

      {/* User Profile Section */}
      {profile && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Your Profile
          </h2>
          <div className="card bg-base-100 border border-primary/20">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{profile.name}</h3>
                  <div className="text-sm text-base-content/70">
                    {[profile.age ? `Age ${profile.age}` : null, profile.gender]
                      .filter(Boolean)
                      .join(' • ') || 'No additional details'}
                  </div>
                  <span className="badge badge-primary badge-sm mt-1">
                    Your Profile
                  </span>
                </div>
                <button
                  onClick={() => handleEditTemplate(profile)}
                  className="btn btn-sm btn-ghost"
                  title="Edit profile"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bookmark className="w-5 h-5" />
            Templates ({templates.length})
          </h2>
          <button
            onClick={handleCreateTemplate}
            className="btn btn-primary btn-sm"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4" />
            Add Template
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : templates.length === 0 ? (
          <div className="card bg-base-100 border border-dashed border-base-300">
            <div className="card-body text-center py-12">
              <Bookmark className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Templates Yet</h3>
              <p className="text-base-content/70 mb-4">
                Create templates for people you travel with frequently.
              </p>
              <button
                onClick={handleCreateTemplate}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" />
                Create Your First Template
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {templates.map((template) => (
              <div key={template.id} className="card bg-base-100 border">
                <div className="card-body p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{template.name}</h3>
                      <div className="text-sm text-base-content/70">
                        {[
                          template.age ? `Age ${template.age}` : null,
                          template.gender,
                        ]
                          .filter(Boolean)
                          .join(' • ') || 'No additional details'}
                      </div>
                      <span className="badge badge-outline badge-sm mt-1">
                        Template
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="btn btn-sm btn-ghost"
                        title="Edit template"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template)}
                        className="btn btn-sm btn-ghost text-error hover:bg-error/10"
                        title="Delete template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Form Modal (would be implemented separately) */}
      {(editingTemplate || showCreateForm) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-base-100 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingTemplate
                  ? editingTemplate.isUserProfile
                    ? 'Edit Profile'
                    : 'Edit Template'
                  : 'Create Template'}
              </h3>

              <TemplateForm
                template={editingTemplate || undefined}
                onCancel={handleCancelEdit}
                onSave={() => {
                  // Refresh will happen automatically via Redux state updates
                  console.log('Template saved successfully');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
