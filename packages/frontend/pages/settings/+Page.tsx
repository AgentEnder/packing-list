import { useAppDispatch } from '@packing-list/state';
import { PageContainer } from '../../components/PageContainer';
import { PageHeader } from '../../components/PageHeader';
import { Settings, AlertTriangle, EyeOff } from 'lucide-react';
import { showToast } from '../../components/Toast';
import { HELP_ALL_KEY } from '../../components/HelpBlurb';

export default function SettingsPage() {
  const dispatch = useAppDispatch();

  const handleResetHelpBlurbs = () => {
    localStorage.removeItem(HELP_ALL_KEY);
    showToast('Help messages have been reset');
  };

  const handleHideAllHelp = () => {
    localStorage.setItem(HELP_ALL_KEY, 'hidden');
    showToast('All help messages have been hidden');
  };

  const handleLoadDemo = () => {
    sessionStorage.setItem('session-demo-choice', 'demo');
    dispatch({ type: 'LOAD_DEMO_DATA' });
    showToast('Demo data has been loaded');
  };

  return (
    <PageContainer>
      <PageHeader title="Settings" />

      <div className="space-y-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Help & Tutorials</h2>
            <p className="text-base-content/70">
              Manage help messages and tutorials that appear throughout the app.
            </p>
            <div className="card-actions justify-end gap-2">
              <button
                className="btn btn-primary"
                onClick={handleResetHelpBlurbs}
              >
                <Settings className="w-4 h-4" />
                Reset Help Messages
              </button>
              <button className="btn" onClick={handleHideAllHelp}>
                <EyeOff className="w-4 h-4" />
                Hide All Help
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Demo Data</h2>
            <p className="text-base-content/70">
              Load the demo trip data to see how the app works with a sample
              trip.
            </p>
            <div className="alert alert-warning mb-4">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Loading demo data will replace your current trip data.
              </span>
            </div>
            <div className="card-actions justify-end">
              <button className="btn btn-primary" onClick={handleLoadDemo}>
                Load Demo Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
