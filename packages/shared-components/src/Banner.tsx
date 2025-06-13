import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';

interface BannerData {
  id: string;
  priority: number; // Lower numbers appear at bottom
  height: number;
}

interface BannerContextValue {
  registerBanner: (id: string, priority: number) => void;
  unregisterBanner: (id: string) => void;
  updateBannerHeight: (id: string, height: number) => void;
  getBottomOffset: (priority: number) => number;
  getTotalBannerHeight: () => number;
}

const BannerContext = createContext<BannerContextValue | null>(null);

export const BannerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [banners, setBanners] = useState<Map<string, BannerData>>(new Map());

  const registerBanner = useCallback((id: string, priority: number) => {
    setBanners((prev) => {
      const newBanners = new Map(prev);
      newBanners.set(id, { id, priority, height: 0 });
      return newBanners;
    });
  }, []);

  const unregisterBanner = useCallback((id: string) => {
    setBanners((prev) => {
      const newBanners = new Map(prev);
      newBanners.delete(id);
      return newBanners;
    });
  }, []);

  const updateBannerHeight = useCallback((id: string, height: number) => {
    setBanners((prev) => {
      const newBanners = new Map(prev);
      const banner = newBanners.get(id);
      if (banner) {
        newBanners.set(id, { ...banner, height });
      }
      return newBanners;
    });
  }, []);

  const getBottomOffset = useCallback(
    (priority: number): number => {
      let offset = 0;
      // Sum heights of all banners with lower priority (higher priority numbers)
      Array.from(banners.values())
        .filter((banner) => banner.priority < priority)
        .forEach((banner) => {
          offset += banner.height;
        });
      return offset;
    },
    [banners]
  );

  const getTotalBannerHeight = useCallback((): number => {
    return Array.from(banners.values()).reduce(
      (total, banner) => total + banner.height,
      0
    );
  }, [banners]);

  return (
    <BannerContext.Provider
      value={{
        registerBanner,
        unregisterBanner,
        updateBannerHeight,
        getBottomOffset,
        getTotalBannerHeight,
      }}
    >
      {children}
    </BannerContext.Provider>
  );
};

const useBannerContext = () => {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error('Banner must be used within BannerProvider');
  }
  return context;
};

export const useBannerHeight = () => {
  const { getTotalBannerHeight } = useBannerContext();
  return getTotalBannerHeight();
};

interface BannerProps {
  id: string;
  priority: number;
  visible: boolean;
  variant?: 'primary' | 'warning' | 'error' | 'success';
  children: React.ReactNode;
  className?: string;
}

export const Banner: React.FC<BannerProps> = ({
  id,
  priority,
  visible,
  variant = 'primary',
  children,
  className = '',
}) => {
  const {
    registerBanner,
    unregisterBanner,
    updateBannerHeight,
    getBottomOffset,
  } = useBannerContext();
  const bannerRef = useRef<HTMLDivElement>(null);

  // Register/unregister banner when visibility changes
  useEffect(() => {
    if (visible) {
      registerBanner(id, priority);
      return () => unregisterBanner(id);
    }
    return () => void 0;
  }, [visible, id, priority, registerBanner, unregisterBanner]);

  // Update height when banner renders
  useEffect(() => {
    if (visible && bannerRef.current) {
      const height = bannerRef.current.offsetHeight;
      updateBannerHeight(id, height);
    }
  }, [visible, id, updateBannerHeight, children]);

  if (!visible) {
    return null;
  }

  const variantClasses = {
    primary: 'bg-primary text-primary-content',
    warning: 'bg-warning text-warning-content',
    error: 'bg-error text-error-content',
    success: 'bg-success text-success-content',
  };

  const bottomOffset = getBottomOffset(priority);

  const style = {
    bottom: `${bottomOffset}px`,
  };

  return (
    <div
      ref={bannerRef}
      className={`fixed left-0 right-0 z-[100] ${className}`}
      style={style}
    >
      <div
        className={`${variantClasses[variant]} px-2 py-1.5 sm:p-4 shadow-lg text-xs sm:text-sm`}
      >
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 max-w-[100vw]">
          {children}
        </div>
      </div>
    </div>
  );
};
