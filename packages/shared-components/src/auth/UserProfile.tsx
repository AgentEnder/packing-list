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
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle avatar"
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
        className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
      >
        <li>
          <div className="justify-between">
            <span>{user.name || 'User'}</span>
            {!isOnline && (
              <span className="badge badge-error badge-sm">Offline</span>
            )}
          </div>
        </li>
        <li>
          <span className="text-sm opacity-70">{user.email}</span>
        </li>
        <li>
          <hr />
        </li>
        <li>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className={loading ? 'loading' : ''}
          >
            Sign Out
          </button>
        </li>
      </ul>
    </div>
  );
}
