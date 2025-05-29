import { ReactNode, useEffect, useState } from 'react';

interface HelpBlurbProps {
  storageKey: string;
  title: string;
  children: ReactNode;
}

export function HelpBlurb({ storageKey, title, children }: HelpBlurbProps) {
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 className="card-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
