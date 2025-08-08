import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to handle click outside events
 * @param handler - Function to call when click outside occurs
 * @param enabled - Whether the hook should be active (default: true)
 * @returns ref to attach to the element you want to detect clicks outside of
 */
export const useClickOutside = <T extends HTMLElement = HTMLElement>(
  handler: () => void,
  enabled: boolean = true
) => {
  const ref = useRef<T>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      handler();
    }
  }, [handler]);

  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      handler();
    }
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    // Small delay to prevent immediate triggering when component mounts
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('keydown', handleEscapeKey, true);
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscapeKey, true);
    };
  }, [handleClickOutside, handleEscapeKey, enabled]);

  return ref;
};
