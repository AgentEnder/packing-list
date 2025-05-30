import { useEffect, useState, PropsWithChildren } from 'react';
import { X } from 'lucide-react';

interface HelpBlurbProps {
  storageKey: string;
  title: string;
}

export const HELP_ALL_KEY = 'help-all';

// Helper function to check if help is hidden
const isHelpHidden = (storageKey: string): boolean => {
  if (typeof window === 'undefined') return false;
  const localStorageKey = `help-${storageKey}`;
  const isIndividuallyHidden =
    localStorage.getItem(localStorageKey) === 'hidden';
  const isGloballyHidden = localStorage.getItem(HELP_ALL_KEY) === 'hidden';
  return isIndividuallyHidden || isGloballyHidden;
};

export const HelpBlurb = ({
  title,
  children,
  storageKey,
}: PropsWithChildren<HelpBlurbProps>) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(!isHelpHidden(storageKey));
  const localStorageKey = `help-${storageKey}`;

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(localStorageKey, 'hidden');
    setIsVisible(false);
  };

  if (!isLoaded || !isVisible) return null;

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
