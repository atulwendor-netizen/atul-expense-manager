import React, { useEffect, useCallback } from 'react';

interface UseModalA11yOptions {
  isOpen: boolean;
  onClose?: () => void;
  closeOnEscape?: boolean;
  lockScroll?: boolean;
}

// Module-level reference-counted scroll-lock manager.
// Safely coordinates nested, concurrent, and transitioning modals without permanently trapping overflow:hidden.
let activeLockCount = 0;
let previousBodyOverflow = '';

export function lockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  if (activeLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  activeLockCount++;
}

export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  activeLockCount = Math.max(0, activeLockCount - 1);
  if (activeLockCount === 0) {
    // Only restore previous overflow if it was not 'hidden', otherwise clear to ''
    const originalOverflow =
      previousBodyOverflow && previousBodyOverflow !== 'hidden' ? previousBodyOverflow : '';
    document.body.style.overflow = originalOverflow;
    previousBodyOverflow = '';
  }
}

export function forceUnlockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  activeLockCount = 0;
  previousBodyOverflow = '';
  document.body.style.overflow = '';
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

  // 2. Prevent background page scrolling with safe reference-counted lock
  useEffect(() => {
    if (!isOpen || !lockScroll) return;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
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
