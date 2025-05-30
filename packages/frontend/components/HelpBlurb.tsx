import { useEffect, useState, PropsWithChildren } from 'react';
import { X } from 'lucide-react';

interface HelpBlurbProps {
  storageKey: string;
  title: string;
}

export const HelpBlurb = ({
  title,
  children,
  storageKey,
}: PropsWithChildren<HelpBlurbProps>) => {
  const [isVisible, setIsVisible] = useState(true);
  const fullStorageKey = `help-blurb-${storageKey}`;

  useEffect(() => {
    const dismissed = localStorage.getItem(fullStorageKey);
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, [fullStorageKey]);

  const handleDismiss = () => {
    localStorage.setItem(fullStorageKey, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body prose relative">
        <button
          onClick={handleDismiss}
          className="btn btn-sm btn-ghost btn-circle absolute right-2 top-2"
          aria-label="Dismiss help"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="card-title">{title}</h2>
        {children}
      </div>
    </div>
  );
};
