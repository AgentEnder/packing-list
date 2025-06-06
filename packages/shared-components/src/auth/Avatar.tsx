import { useState } from 'react';
import { WifiOff } from 'lucide-react';

interface AvatarProps {
  /** The avatar URL (can be http URL, data URL, or undefined) */
  src?: string;
  /** Alt text for the image */
  alt: string;
  /** Size in pixels (default: 40) */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show a circular avatar */
  rounded?: boolean;
  /** Whether the user is online (shows offline indicator when false) */
  isOnline?: boolean;
  /** Whether to show the offline indicator (default: true) */
  showOfflineIndicator?: boolean;
}

/**
 * Avatar component with optional offline indicator
 *
 * @example
 * // Basic usage
 * <Avatar src={user.avatar_url} alt={user.name} />
 *
 * @example
 * // With offline indicator
 * <Avatar
 *   src={user.avatar_url}
 *   alt={user.name}
 *   size={48}
 *   isOnline={connectivity.isOnline}
 * />
 *
 * @example
 * // Disable offline indicator
 * <Avatar
 *   src={user.avatar_url}
 *   alt={user.name}
 *   showOfflineIndicator={false}
 * />
 */
export function Avatar({
  src,
  alt,
  size = 40,
  className = '',
  rounded = true,
  isOnline = true,
  showOfflineIndicator = true,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarUrl = (url: string) => {
    // If it's already a data URL (base64 from IndexedDB), use it directly
    if (url && url.startsWith('data:')) {
      return url;
    }

    // Use a CORS proxy for Google images
    if (url && url.includes('googleusercontent.com')) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(
        url
      )}&w=${size}&h=${size}&fit=cover&mask=${rounded ? 'circle' : ''}`;
    }

    // For other URLs, return as-is
    return url;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const initials = getInitials(alt);
  const avatarUrl = src ? getAvatarUrl(src) : null;
  const sizeClass = `w-${Math.ceil(size / 4)} h-${Math.ceil(size / 4)}`;
  const roundedClass = rounded ? 'rounded-full' : 'rounded';

  // Calculate indicator size based on avatar size
  const indicatorSize = Math.max(12, Math.round(size * 0.3));
  const indicatorOffset = Math.round(size * 0.05);

  return (
    <div className="relative inline-block">
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={alt}
          className={`${sizeClass} ${roundedClass} object-cover ${className}`}
          style={{ width: size, height: size }}
          onError={handleImageError}
        />
      ) : (
        // Fallback to initials
        <div
          className={`bg-primary text-primary-content ${roundedClass} flex items-center justify-center font-medium ${className}`}
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          {initials}
        </div>
      )}

      {/* Offline indicator */}
      {showOfflineIndicator && !isOnline && (
        <div
          className="absolute bg-error text-error-content rounded-full flex items-center justify-center border-2 border-base-100"
          style={{
            width: indicatorSize,
            height: indicatorSize,
            top: indicatorOffset,
            right: indicatorOffset,
          }}
          title="Offline"
        >
          <WifiOff size={indicatorSize * 0.6} className="text-error-content" />
        </div>
      )}
    </div>
  );
}
