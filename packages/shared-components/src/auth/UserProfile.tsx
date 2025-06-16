import { useAuth } from './useAuth.js';
import { Avatar } from './Avatar.js';

export function UserProfile() {
  const { user, signOut, loading, isOnline } = useAuth();

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const displayName = user.name || user.email;

  return (
    <div className="dropdown dropdown-end" data-testid="user-profile">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-circle btn-ghost hover:bg-base-200 transition-colors duration-200 flex items-center justify-center min-w-0"
        data-testid="user-profile-avatar"
      >
        <Avatar
          src={user.avatar_url}
          alt={displayName}
          size={40}
          isOnline={isOnline}
        />
      </div>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-64"
        data-testid="user-profile-menu"
      >
        <li>
          <div className="justify-between">
            <span className="truncate" data-testid="user-name">
              {user.name || 'User'}
            </span>
            {!isOnline && (
              <span
                className="badge badge-error badge-sm ml-2 flex-shrink-0"
                data-testid="offline-badge"
              >
                Offline
              </span>
            )}
          </div>
        </li>
        <li>
          <div className="tooltip tooltip-top" data-tip={user.email}>
            <span
              className="text-sm opacity-70 truncate block w-full text-left"
              data-testid="user-email"
            >
              {user.email}
            </span>
          </div>
        </li>
        <li>
          <hr />
        </li>
        <li>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className={loading ? 'loading' : ''}
            data-testid="sign-out-button"
          >
            Sign Out
          </button>
        </li>
      </ul>
    </div>
  );
}
