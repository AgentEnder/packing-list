import { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { Avatar } from './Avatar.js';

interface LocalAccount {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  passcode_hash?: string;
}

interface LocalAccountSelectorProps {
  accounts: LocalAccount[];
  onAccountSelect: (account: LocalAccount) => void;
  onCreateNew: () => void;
  loading?: boolean;
  error?: string | null;
}

export function LocalAccountSelector({
  accounts,
  onAccountSelect,
  onCreateNew,
  loading = false,
  error,
}: LocalAccountSelectorProps) {
  const [selectedAccount, setSelectedAccount] = useState<LocalAccount | null>(
    null
  );

  const handleAccountClick = (account: LocalAccount) => {
    setSelectedAccount(account);
    onAccountSelect(account);
  };

  if (accounts.length === 0) {
    return (
      <div className="text-center space-y-4">
        <div className="alert alert-info">
          <User className="w-4 h-4" />
          <div>
            <h4 className="font-bold">No local accounts found</h4>
            <div className="text-sm">
              Create a local account to use the app offline.
            </div>
          </div>
        </div>
        <button
          className="btn btn-primary w-full"
          onClick={onCreateNew}
          disabled={loading}
        >
          <User className="w-4 h-4" />
          Create Local Account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-base-content">
          Choose an account
        </h3>
        <p className="text-sm text-base-content/70 mt-2">
          Select a local account to continue offline
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        {accounts.map((account) => (
          <button
            key={account.id}
            className={`w-full p-3 rounded-lg border-2 transition-all ${
              selectedAccount?.id === account.id
                ? 'border-primary bg-primary/10'
                : 'border-base-300 hover:border-base-400 hover:bg-base-200'
            } ${loading ? 'loading' : ''}`}
            onClick={() => handleAccountClick(account)}
            disabled={loading}
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={account.avatar_url}
                alt={account.name || account.email}
                size={40}
                isOnline={false}
                showOfflineIndicator={false}
              />
              <div className="flex-1 text-left">
                <div className="font-medium">
                  {account.name || account.email}
                </div>
                <div className="text-sm text-base-content/70">
                  {account.email}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {account.passcode_hash && (
                  <div className="tooltip" data-tip="Password protected">
                    <Lock className="w-4 h-4 text-warning" />
                  </div>
                )}
                {loading && selectedAccount?.id === account.id && (
                  <span className="loading loading-spinner loading-sm"></span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="divider">OR</div>

      <button
        className="btn btn-outline w-full"
        onClick={onCreateNew}
        disabled={loading}
      >
        <User className="w-4 h-4" />
        Create New Local Account
      </button>
    </div>
  );
}
