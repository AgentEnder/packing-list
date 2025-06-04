import { useState } from 'react';
import { useAuth } from './useAuth.js';

export function UserProfile() {
  const { user, signOut, loading } = useAuth();
  const [imageError, setImageError] = useState(false);

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProxiedImageUrl = (url: string) => {
    // Use a CORS proxy for Google images
    if (url && url.includes('googleusercontent.com')) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(
        url
      )}&w=40&h=40&fit=cover&mask=circle`;
    }
    return url;
  };

  const displayName = user.name || user.email;
  const initials = getInitials(displayName);
  const avatarUrl = user.avatar_url
    ? getProxiedImageUrl(user.avatar_url)
    : null;

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle avatar"
      >
        <div className="w-10 rounded-full">
          {avatarUrl && !imageError ? (
            <img
              src={avatarUrl}
              alt={displayName}
              onError={handleImageError}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium">
              {initials}
            </div>
          )}
        </div>
      </div>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
      >
        <li>
          <div className="justify-between">
            <span>{user.name || 'User'}</span>
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
