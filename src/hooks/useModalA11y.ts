import React, { useEffect, useCallback } from 'react';

interface UseModalA11yOptions {
  isOpen: boolean;
  onClose?: () => void;
  closeOnEscape?: boolean;
  lockScroll?: boolean;
}

export function useModalA11y({
  isOpen,
  onClose,
  closeOnEscape = true,
  lockScroll = true,
}: UseModalA11yOptions) {
  // 1. Close on Escape key press
  useEffect(() => {
    if (!isOpen || !closeOnEscape || !onClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  // 2. Prevent background page scrolling when modal is open
  useEffect(() => {
    if (!isOpen || !lockScroll || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, lockScroll]);

  // 3. Close on backdrop overlay click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && onClose) {
        onClose();
      }
    },
    [onClose]
  );

  return {
    handleBackdropClick,
    modalAttributes: {
      role: 'dialog' as const,
      'aria-modal': true as const,
    },
  };
}
