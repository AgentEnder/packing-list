import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage URL hash state
 * @param defaultHash - Default hash value when no hash is present
 * @returns Object with current hash, setter function, and utility functions
 */
export function useUrlHash(defaultHash = '') {
  const [hash, setHashState] = useState(() => {
    // Initialize from current URL hash on mount
    if (typeof window !== 'undefined') {
      const currentHash = window.location.hash.slice(1); // Remove the '#'
      return currentHash || defaultHash;
    }
    return defaultHash;
  });

  // Update hash in URL and state
  const setHash = useCallback((newHash: string) => {
    if (typeof window !== 'undefined') {
      const hashWithoutPrefix = newHash.startsWith('#')
        ? newHash.slice(1)
        : newHash;

      // Update URL hash without triggering page reload
      if (hashWithoutPrefix) {
        window.history.replaceState(null, '', `#${hashWithoutPrefix}`);
      } else {
        // Remove hash from URL
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );
      }

      setHashState(hashWithoutPrefix);
    }
  }, []);

  // Listen for hash changes (e.g., browser back/forward)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashChange = () => {
      const currentHash = window.location.hash.slice(1);
      setHashState(currentHash || defaultHash);
    };

    window.addEventListener('hashchange', handleHashChange);

    // Also listen for popstate in case hash is changed programmatically
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [defaultHash]);

  // Utility function to check if a specific hash is active
  const isHashActive = useCallback(
    (targetHash: string) => {
      const cleanTargetHash = targetHash.startsWith('#')
        ? targetHash.slice(1)
        : targetHash;
      return hash === cleanTargetHash;
    },
    [hash]
  );

  // Utility function to get full hash with '#' prefix
  const getFullHash = useCallback(() => {
    return hash ? `#${hash}` : '';
  }, [hash]);

  return {
    hash,
    setHash,
    isHashActive,
    getFullHash,
  };
}
