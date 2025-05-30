import { CheckCircle2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

type Toast = {
  id: string;
  message: string;
};

type ToastProps = {
  message: string;
  onRemove: () => void;
};

/**
 * Individual toast component that handles its own animation state
 * and cleanup via the onRemove callback
 */
function Toast({ message, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for animation to complete before removing
      setTimeout(onRemove, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <div
      className={`
        alert alert-success transition-all duration-300
        ${
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
        }
      `}
    >
      <span className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4" />
        {message}
      </span>
    </div>
  );
}

// Global state for managing toasts across the app
// We use these to allow showing toasts from anywhere without prop drilling
let toastId = 0;
const toasts: Toast[] = [];
let setToastsState: React.Dispatch<React.SetStateAction<Toast[]>> | null = null;

/**
 * Public API to show a toast notification
 * Can be called from anywhere in the app
 */
export function showToast(message: string) {
  if (!setToastsState) return;

  const id = `toast-${toastId++}`;
  const newToast = { id, message };
  toasts.push(newToast);
  setToastsState([...toasts]);
}

/**
 * Container component that uses React Portal to render toasts
 * outside of the normal DOM hierarchy
 *
 * This component should be mounted once at the root level
 * of your app. It will handle:
 * 1. Creating a portal to the document body
 * 2. Managing the toast state
 * 3. Providing the setState function for the showToast API
 */
export function ToastContainer() {
  // Portal mount point in the DOM (body element)
  const [mountPoint, setMountPoint] = useState<HTMLElement | null>(null);
  // Local state that drives the toast renders
  const [toastState, setToastState] = useState<Toast[]>([]);
  // Make the setState function available to the showToast API
  setToastsState = setToastState;

  useEffect(() => {
    // Set up the portal mount point
    setMountPoint(document.body);
    return () => {
      // Clean up the setState reference when unmounted
      setToastsState = null;
    };
  }, []);

  const removeToast = (id: string) => {
    const index = toasts.findIndex((t) => t.id === id);
    if (index > -1) {
      toasts.splice(index, 1);
      setToastState([...toasts]);
    }
  };

  // Don't render anything until we have a mount point
  if (!mountPoint) return null;

  // Create a portal to render the toasts at the end of the document body
  return createPortal(
    <div className="toast toast-end z-[9999]">
      {toastState.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>,
    mountPoint
  );
}
